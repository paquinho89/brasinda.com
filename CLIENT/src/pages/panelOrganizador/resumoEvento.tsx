import API_BASE_URL from "../../utils/api";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "react-bootstrap";
import MainNavbar from "../componentes/NavBar";
import { FaArrowLeft, FaCalendarAlt, FaMapMarkerAlt, FaTicketAlt, FaCreditCard, FaMoneyBill, FaEuroSign } from "react-icons/fa";

interface Evento {
	id: number;
	nome_evento: string;
	data_evento: string;
	localizacion: string;
	entradas_venta: number;
	entradas_reservadas?: number;
	entradas_vendidas?: number;
	prezo_evento?: number | null;
	tipo_gestion_entrada?: "pagina" | "manual" | "gratis" | null;
}

export default function ResumoEvento() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const [evento, setEvento] = useState<Evento | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchEvento = async () => {
			if (!id) return;
			try {
				const token = localStorage.getItem("access_token");
				const resp = await fetch(`${API_BASE_URL}/crear-eventos/${id}/`, {
					headers: token ? { Authorization: `Bearer ${token}` } : {},
				});
				if (!resp.ok) throw new Error("Evento non atopado");
				const data = await resp.json();
				setEvento(data);
			} catch (e: any) {
				setError(e.message || "Erro ao cargar o resumo do evento");
			} finally {
				setLoading(false);
			}
		};

		fetchEvento();
	}, [id]);

	if (loading) return <div className="container py-4">Cargando resumo do evento...</div>;
	if (error) return <div className="container py-4 text-danger">{error}</div>;
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
		return `${dataCapitalizada} ás ${hora}`;
	};

	const aforoTotal = evento.entradas_venta || 0;
	const vendidas = evento.entradas_vendidas ?? 0;
	const reservadas = evento.entradas_reservadas ?? 0;
	const senVender = Math.max(0, aforoTotal - vendidas - reservadas);

	const pctVendidas = aforoTotal > 0 ? (vendidas / aforoTotal) * 100 : 0;
	const pctReservadas = aforoTotal > 0 ? (reservadas / aforoTotal) * 100 : 0;
	const pctSenVender = aforoTotal > 0 ? (senVender / aforoTotal) * 100 : 0;

	const isEventoGratuito =
		evento.tipo_gestion_entrada === "gratis" || Number(evento.prezo_evento ?? 0) <= 0;

	const textoXestionImporte =
		evento.tipo_gestion_entrada === "pagina"
			? "Xestionado a través da páxina"
			: evento.tipo_gestion_entrada === "manual"
			? "Xestionado polo organizador"
			: null;

	const diñeiroRecaudado = (Number(evento.prezo_evento ?? 0) * vendidas).toFixed(2);
	const localizacionSenAuditorio = evento.localizacion
		.replace(/auditorio/gi, "")
		.replace(/\s{2,}/g, " ")
		.trim();

	const handleEliminarDefinitivo = async () => {
		if (!id) return;

		const confirmar = window.confirm(
			"Queres eliminar este evento definitivamente? Esta acción non se pode desfacer."
		);
		if (!confirmar) return;

		try {
			const token = localStorage.getItem("access_token");
			const resp = await fetch(`${API_BASE_URL}/crear-eventos/${id}/eliminar-definitivo/`, {
				method: "DELETE",
				headers: token ? { Authorization: `Bearer ${token}` } : {},
			});

			if (!resp.ok) {
				throw new Error("Non se puido eliminar o evento definitivamente");
			}

			navigate("/panel-organizador");
		} catch (e: any) {
			alert(e.message || "Erro ao eliminar o evento");
		}
	};

	return (
		<>
			<MainNavbar />
			<div className="container py-4">
				<div className="card shadow-sm">
					<div className="card-body">
						<div className="d-flex align-items-center mb-4">
							<h2 className="m-0 flex-grow-1">Resumo do evento</h2>
							<Button className="cancelar-evento-btn" onClick={() => navigate(-1)}>
								<FaArrowLeft className="me-1" />
								Volver
							</Button>
						</div>

						<div className="mb-2">
							<h4 className="mb-3 fw-bold">{evento.nome_evento}</h4>
							{isEventoGratuito && (
								<p className="mb-3 fw-bold fs-4" style={{ color: "#ff0093" }}>
									Evento Gratuíto
								</p>
							)}
							<p className="mb-2">
								<FaMapMarkerAlt className="me-2" />
								<strong>Localización:</strong> {localizacionSenAuditorio || evento.localizacion}
							</p>
							<p className="mb-3">
								<FaCalendarAlt className="me-2" />
								<strong>Data:</strong> {formatDataCompleta(evento.data_evento)}
							</p>
						</div>

						<div className="mb-3">
							<p className="mb-2">
								<FaTicketAlt className="me-2" />
								<strong>Aforo total:</strong> {aforoTotal}
							</p>
						</div>

						<div
							className="d-flex w-100 mb-3"
							style={{
								height: "40px",
								borderRadius: "8px",
								overflow: "hidden",
								border: "1px solid #ddd",
							}}
						>
							{pctVendidas > 0 && (
								<div
									style={{
										width: `${pctVendidas}%`,
										backgroundColor: "#60dd49",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										color: "white",
										fontSize: "0.85rem",
										fontWeight: "bold",
									}}
									title={`Vendidas: ${vendidas}`}
								>
									{pctVendidas > 8 && vendidas}
								</div>
							)}

							{pctReservadas > 0 && (
								<div
									style={{
										width: `${pctReservadas}%`,
										backgroundColor: "#ff0093",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										color: "white",
										fontSize: "0.85rem",
										fontWeight: "bold",
									}}
									title={`Reservadas: ${reservadas}`}
								>
									{pctReservadas > 8 && reservadas}
								</div>
							)}

							{pctSenVender > 0 && (
								<div
									style={{
										width: `${pctSenVender}%`,
										backgroundColor: "#82CAD3",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										color: "white",
										fontSize: "0.85rem",
										fontWeight: "bold",
									}}
									title={`Sen vender: ${senVender}`}
								>
									{pctSenVender > 8 && senVender}
								</div>
							)}
						</div>

						<div className="row g-2 mb-4">
							<div className="col-6 col-md-4">
								<small className="text-muted d-block">Vendidas</small>
								<strong>{vendidas}</strong>
							</div>
							<div className="col-6 col-md-4">
								<small className="text-muted d-block">Reservadas</small>
								<strong>{reservadas}</strong>
							</div>
							<div className="col-6 col-md-4">
								<small className="text-muted d-block">Sen vender</small>
								<strong>{senVender}</strong>
							</div>
						</div>

						{!isEventoGratuito && (
							<>
								{textoXestionImporte && (
									<p className="mb-2">
										<FaCreditCard className="me-2" />
										<strong>Xestión do cobro:</strong> {textoXestionImporte}
									</p>
								)}
								{evento.tipo_gestion_entrada === "manual" && (
									<p className="mb-2">
									<FaEuroSign className="me-2" />
										<strong>Prezo do evento:</strong> {evento.prezo_evento} €
									</p>
								)}
							<p className="mb-1">
								<FaMoneyBill className="me-2" />
								<strong>Diñeiro recadado:</strong> {diñeiroRecaudado} €
							</p>
							<small className="text-muted ms-4">
								*O diñeiro recadado foi xestionado polo organizador do evento
							</small>
							</>
						)}

						<div className="d-flex justify-content-between mt-4">
							<Button className="cancelar-evento-btn" onClick={handleEliminarDefinitivo}>
								Eliminar evento definitivamente
							</Button>
							<Button className="cancelar-evento-btn" onClick={() => navigate(-1)}>
								Volver
							</Button>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
