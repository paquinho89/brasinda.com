import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Modal } from "react-bootstrap";
import { FaCalendarAlt, FaTicketAlt, FaCreditCard, FaArrowLeft, FaExclamationTriangle, FaEnvelope, FaUser } from "react-icons/fa";
import MainNavbar from "../componentes/NavBar";
import LoginModalCrearEvento from "../componentes/InicioSesionCrearEventoCuadro";

import API_BASE_URL from "../../utils/api";

interface Evento {
	id: number;
	imaxe_evento?: string | null;
	nome_evento: string;
	descripcion_evento?: string;
	data_evento: string;
	localizacion: string;
	entradas_venta: number;
	entradas_reservadas?: number;
	entradas_vendidas?: number;
	prezo_evento?: number;
	tipo_gestion_entrada?: string;
	procedimiento_cobro_manual?: string | null;
}

export default function ReservarEntradaSinPlano() {
	const { id } = useParams<{ id: string }>();
	const [evento, setEvento] = useState<Evento | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [errorEmail, setErrorEmail] = useState("");
	const [errorNome, setErrorNome] = useState("");
	const [errorCantidade, setErrorCantidade] = useState("");
	const [cantidadeReservar, setCantidadeReservar] = useState<number>(0);
	const [nomeXeral, setNomeXeral] = useState("");
	const [nomearTodas, setNomearTodas] = useState(false);
	const [nomesAsistentes, setNomesAsistentes] = useState<string[]>([]);
	const [gardando, setGardando] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const [suscribirseEventos, setSuscribirseEventos] = useState(false);
	const [emailSuscripcion, setEmailSuscripcion] = useState("");
	const [showLoginModal, setShowLoginModal] = useState(false);
	const [pendingReserva, setPendingReserva] = useState<null | (() => void)>(null);
	const navigate = useNavigate();

	useEffect(() => {
		if (!id) return;

		const fetchEvento = async () => {
			try {
				const resp = await fetch(`${API_BASE_URL}/crear-eventos/publico/${id}/`);
				if (!resp.ok) throw new Error("Evento non atopado");
				const data = await resp.json();
				setEvento(data);
			} catch (e: any) {
				console.error(e);
				setError(e.message || "Erro ao cargar evento");
			} finally {
			}
		};

		fetchEvento();
	}, [id]);

	useEffect(() => {
		if (!nomearTodas) return;
		setNomesAsistentes((prev) => {
			const trimmed = prev.slice(0, cantidadeReservar);
			while (trimmed.length < cantidadeReservar) {
				trimmed.push("");
			}
			return trimmed;
		});
	}, [cantidadeReservar, nomearTodas]);

	useEffect(() => {
		if (cantidadeReservar <= 1 && nomearTodas) {
			setNomearTodas(false);
		}
	}, [cantidadeReservar, nomearTodas]);

	const handleCantidadeChange = (value: string) => {
		setErrorCantidade("");
		const parsed = Number.parseInt(value, 10);
		if (Number.isNaN(parsed)) {
			setCantidadeReservar(0);
			return;
		}
		setCantidadeReservar(Math.max(0, parsed));
	};

	const handleNomeAsistenteChange = (idx: number, value: string) => {
		setNomesAsistentes((prev) => {
			const next = [...prev];
			next[idx] = value;
			return next;
		});
	};

	const limparFormulario = () => {
		setCantidadeReservar(0);
		setNomeXeral("");
		setNomesAsistentes([]);
		setNomearTodas(false);
		setSuscribirseEventos(false);
		setEmailSuscripcion("");
	};

	// const isFormValid = () => {
	//   if (cantidadeReservar <= 0) return false;
	//   if (nomearTodas) {
	//     const nomesValidos = nomesAsistentes.slice(0, cantidadeReservar);
	//     return nomesValidos.every((nome) => nome.trim().length > 0);
	//   }
	//   if (!nomeXeral.trim().length) return false;
	//   const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	//   if (!emailSuscripcion.trim().length || !isValidEmail(emailSuscripcion)) return false;
	//   return true;
	// };

	const gardarReserva = async () => {
		setError(null);
		setErrorEmail("");
		setErrorNome("");
		setErrorCantidade("");

		if (!evento) return;

		if (cantidadeReservar <= 0) {
			setErrorCantidade("Debes seleccionar polo menos unha entrada");
			return;
		}
		if (!nomearTodas && !emailSuscripcion.trim()) {
			setErrorEmail("Por favor, introduce un email válido");
			return;
		}
		if (!nomearTodas && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailSuscripcion)) {
			setErrorEmail("Por favor, introduce un email válido");
			return;
		}
		if (!nomearTodas && !nomeXeral.trim()) {
			setErrorNome("Por favor, introduce o teu nome");
			return;
		}
		if (nomearTodas && cantidadeReservar > 0 && nomesAsistentes.length !== cantidadeReservar) {
			setErrorNome("Revisa os nomes das entradas antes de gardar.");
			return;
		}

		setGardando(true);
		try {
			const nomesParaGardar = nomearTodas ? nomesAsistentes.slice(0, cantidadeReservar) : [];

			const resp = await fetch(`${API_BASE_URL}/crear-eventos/${evento.id}/invitacions-sen-plano/`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					cantidade: cantidadeReservar,
					email: emailSuscripcion,
					nomes: nomesParaGardar,
					nome_xeral: nomeXeral,
					...(suscribirseEventos && { email_suscripcion: emailSuscripcion }),
				}),
			});

			if (resp.status === 401) {
				setShowLoginModal(true);
				setPendingReserva(() => gardarReserva);
				setGardando(false);
				return;
			}

			const data = await resp.json().catch(() => null);
			if (!resp.ok) {
				setError(data?.detail || data?.error || "Non se puideron gardar as entradas.");
				setGardando(false);
				return;
			}
			let reservasIds = [];
			if (Array.isArray(data?.reservas)) {
				reservasIds = data.reservas.map((r: any) => r.id).filter(Boolean);
			}
			const ticketId = data?.ticket_id || data?.id || data?.ticketId;

			// Se o pago é online ("pagina" ou "a través da páxina"), NUNCA enviar email aquí!
			// Só navegar a infoPagamento, o email cos PDFs enviarase despois do pago desde infoPagamento.tsx
			if (evento.tipo_gestion_entrada === "pagina" || evento.tipo_gestion_entrada === "a través da páxina") {
				const prezoEvento = Number(evento.prezo_evento ?? 0);
				const importeTotal = prezoEvento * cantidadeReservar;
				navigate(`/info-pagamento/${evento.id}/senplano`, {
					state: {
						reservas: reservasIds,
						ticketId,
						email: emailSuscripcion,
						eventoId: evento.id,
						nomes: nomearTodas ? nomesAsistentes.slice(0, cantidadeReservar) : [],
						nome_xeral: nomeXeral,
						cantidade: cantidadeReservar,
						suscribirseEventos,
						importeTotal,
						prezoEvento,
					}
				});
				setGardando(false);
				return;
			}

			// Se o pago é MANUAL, enviar email cos PDFs aquí antes de navegar a ReservaExitosa
			try {
				let seatsToSend = reservasIds.map((id: number) => ({ id }));
				await fetch(`${API_BASE_URL}/crear-eventos/${evento.id}/enviar-entradas/`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						zona: undefined, // ou null, se non hai zona
						entradas: seatsToSend,
						email: emailSuscripcion,
					}),
				});
			} catch (err) {
				setError("Reserva realizada, pero non se puido enviar o email.");
			}
			navigate('/reserva-exitosa', { state: { reservas: reservasIds, ticketId, email: emailSuscripcion } });
			limparFormulario();
			setSuscribirseEventos(false);
			setEmailSuscripcion("");
		} catch (e: any) {
			setError(e.message || "Produciuse un erro ao gardar as entradas.");
			limparFormulario();
		} finally {
			setGardando(false);
		}
	};
	if (!evento) return <div className="container py-4">Evento non encontrado</div>;

	const formatDataCompleta = (dateString: string) => {
		const date = new Date(dateString);

		const data = new Intl.DateTimeFormat("gl-ES", {
			weekday: "long",
			day: "numeric",
			month: "long",
			year: "numeric",
		}).format(date);

		const hora = new Intl.DateTimeFormat("gl-ES", {
			hour: "2-digit",
			minute: "2-digit",
		}).format(date);

		const dataCapitalizada = data.charAt(0).toUpperCase() + data.slice(1);
		return `${dataCapitalizada} as ${hora}`;
	};

	const dataFormato = formatDataCompleta(evento.data_evento);
	const prezoEvento = Number(evento.prezo_evento ?? 0);
	const prezoFormatado = Number.isInteger(prezoEvento)
		? String(prezoEvento)
		: prezoEvento.toFixed(2);

	   // Engadir estilos para ocultar o texto 'Volver' en pantallas pequenas
	   const volverTextStyle = `
	   @media (max-width: 576px) {
		 .volver-text {
		   display: none !important;
		 }
	   }
	   `;

	   return (
		   <>
			   <style>{volverTextStyle}</style>
			   <MainNavbar />
			   <div className="container py-4">
				   <div className="card shadow-sm">
					   <div className="p-3">
						   <div className="d-flex align-items-start pb-2 mb-3">
							   <Button className="volver-btn me-3" onClick={() => navigate(-1)}>
								   <FaArrowLeft className="me-2" />
								   <span className="volver-text">Volver</span>
							   </Button>
							<div className="flex-grow-1 text-center">
								<h2 className="m-0 mb-2">{evento.nome_evento}</h2>
								<p className="text-center mb-1 mt-0">
									<FaCalendarAlt className="me-1" />
									{dataFormato}
								</p>
								<p className="text-center mb-0 mt-0">
									<strong>{evento.localizacion}</strong>
								</p>
							</div>
							<div style={{ width: "100px" }}></div>
						</div>
					</div>

					<div className="card-body">
						<div className="mb-3" style={{ maxWidth: "400px" }}>
							<label htmlFor="cantidade-reserva" className="form-label" style={{ display: 'flex', alignItems: 'center', fontWeight: 700 }}>
								<FaTicketAlt style={{ color: '#ff0093', marginRight: 8, fontSize: '1.2em' }} />
								<span style={{ fontWeight: 700 }}>Número de entradas a reservar:</span>
							</label>
							<div style={{ maxWidth: 180 }}>
								<input
										id="cantidade-reserva"
										type="number"
										min={0}
										step={1}
										value={cantidadeReservar > 0 ? cantidadeReservar : ""}
										onChange={(e) => handleCantidadeChange(e.target.value)}
										className="form-control"
										placeholder="0"
										style={{ borderRadius: 8, width: 80, textAlign: 'center', fontWeight: 600 }}
									/>
							</div>
							{errorCantidade && (
								<div className="alert alert-danger" style={{ background: "#ffe6f3", color: "#000", marginTop: 0, display: 'flex', alignItems: 'center' }}>
									<FaExclamationTriangle style={{ color: '#ff0093', marginRight: 8 }} />
									{errorCantidade}
								</div>
							)}
						</div>

						{!nomearTodas && (
							<>
							<div className="mb-3" style={{ maxWidth: "400px" }}>
								<label htmlFor="email-xeral" className="form-label" style={{ display: 'flex', alignItems: 'center', fontWeight: 700 }}>
									<FaEnvelope style={{ color: '#ff0093', marginRight: 8, fontSize: '1.2em' }} />
									<span style={{ fontWeight: 700 }}>Email:</span>
								</label>
								<input
									id="email-xeral"
									type="email"
									value={emailSuscripcion}
									onChange={(e) => setEmailSuscripcion(e.target.value)}
									className="form-control"
									placeholder="Introduce o teu email"
								/>
								{!nomearTodas && errorEmail && (
									<div className="alert alert-danger" style={{ background: "#ffe6f3", color: "#000", marginTop: 0, display: 'flex', alignItems: 'center' }}>
										<FaExclamationTriangle style={{ color: '#ff0093', marginRight: 8 }} />
										{errorEmail}
									</div>
								)}
							</div>
							<div className="mb-3" style={{ maxWidth: "400px" }}>
								<label htmlFor="nome-xeral" className="form-label" style={{ display: 'flex', alignItems: 'center', fontWeight: 700 }}>
									<FaUser style={{ color: '#ff0093', marginRight: 8, fontSize: '1.2em' }} />
									<span style={{ fontWeight: 700 }}>Nome:</span>
								</label>
								<input
									id="nome-xeral"
									type="text"
									value={nomeXeral}
									onChange={(e) => setNomeXeral(e.target.value)}
									className="form-control"
									placeholder="Nome da reserva"
								/>
								{!nomearTodas && errorNome && (
									<div className="alert alert-danger" style={{ background: "#ffe6f3", color: "#000", marginTop: 0, display: 'flex', alignItems: 'center' }}>
										<FaExclamationTriangle style={{ color: '#ff0093', marginRight: 8 }} />
										{errorNome}
									</div>
								)}
							</div>
							</>
						)}

						{cantidadeReservar > 1 && (
							<div className="form-check mb-3">
								<input
									id="nomear-todas"
									type="checkbox"
									className="form-check-input checkbox-verde"
									checked={nomearTodas}
									onChange={(e) => setNomearTodas(e.target.checked)}
									style={{ accentColor: "#ff0093" }}
								/>
								<label htmlFor="nomear-todas" className="form-check-label">
									Quero nomear todos os asistentes individualmente
								</label>
							</div>
						)}

						{nomearTodas && cantidadeReservar > 0 && (
							<div className="mb-3">
								<p className="mb-2">Nomes dos asistentes</p>
								<div className="d-grid" style={{ gap: "8px" }}>
									{Array.from({ length: cantidadeReservar }).map((_, idx) => (
										<input
											key={`invitacion-${idx}`}
											type="text"
											className="form-control"
											placeholder={`Nome asistente ${idx + 1}`}
											value={nomesAsistentes[idx] || ""}
											onChange={(e) => handleNomeAsistenteChange(idx, e.target.value)}
										/>
									))}
								</div>
								{nomearTodas && errorNome && (
									<div className="alert alert-danger" style={{ background: "#ffe6f3", color: "#000", marginTop: 0, display: 'flex', alignItems: 'center' }}>
										<FaExclamationTriangle style={{ color: '#ff0093', marginRight: 8 }} />
										{errorNome}
									</div>
								)}
							</div>
						)}

						{evento.prezo_evento != null && (
							<p className="mt-3 mb-4">
								<FaTicketAlt className="me-1" />
								{prezoEvento > 0 ? (
									<strong>{prezoFormatado} €</strong>
								) : (
									<strong>Evento de Balde</strong>
								)}
							</p>
						)}

						{evento.procedimiento_cobro_manual && (
							<div className="mt-3">
								<FaCreditCard className="me-1" style={{ color: "#155724" }} />
								<strong>Xestión do pago: </strong>
								{evento.procedimiento_cobro_manual}
							</div>
						)}

						<div className="form-check mb-3 mt-4">
							<input
								id="suscribirse-eventos"
								type="checkbox"
								className="form-check-input checkbox-verde"
								checked={suscribirseEventos}
								onChange={(e) => setSuscribirseEventos(e.target.checked)}
								disabled={gardando}
								style={{ accentColor: "#ff0093" }}
							/>
							<label htmlFor="suscribirse-eventos" className="form-check-label">
								<strong>Quero estar informado dos eventos que acontecen na miña zona</strong>
							</label>
						</div>



						<div className="d-flex justify-content-start">
						<button
							type="button"
							className="reserva-entrada-btn"
							onClick={gardarReserva}
							disabled={gardando}
						>
							{gardando ? "Enviando..." : "Reservar Entradas"}
						</button>
						</div>

						{error && !errorCantidade && !errorEmail && !errorNome && (
							<div className="alert alert-danger" style={{ background: "#ffe6f3", color: "#000", marginTop: 0, display: 'flex', alignItems: 'center' }}>
								<FaExclamationTriangle style={{ color: '#ff0093', marginRight: 8 }} />
								{error}
							</div>
						)}
					</div>
				</div>
			</div>

			<Modal show={showModal} onHide={() => setShowModal(false)} centered>
				<Modal.Header closeButton>
					<Modal.Title>
						<span style={{ color: "#ff0093" }}>✓</span> Entradas Reservadas
					</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					{evento?.procedimiento_cobro_manual && (
						<div className="d-flex align-items-start">
							<FaCreditCard style={{ fontSize: "1.5em", marginRight: "12px", color: "#155724", marginTop: "4px" }} />
							<div className="flex-grow-1">
								<strong style={{ fontSize: "1.2em" }}>Xestión do pago:</strong>
								<p className="mt-2 mb-0">{evento.procedimiento_cobro_manual}</p>
							</div>
						</div>
					)}
				</Modal.Body>
				<Modal.Footer>
					<button 
						className="reserva-entrada-btn" 
						onClick={() => {
							setShowModal(false);
							navigate('/');
						}}
					>
						Entendido
					</button>
				</Modal.Footer>
			</Modal>

			<LoginModalCrearEvento show={showLoginModal} onClose={() => {
				setShowLoginModal(false);
				if (pendingReserva) {
					pendingReserva();
					setPendingReserva(null);
				}
			}} redirectTo={undefined} />
		</>
	);
}
