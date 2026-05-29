import { Container, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import MainNavbar from "../NavBar";
import Footer from "../footer";

const cookieTableRows = [
	{
		cookie: "sessionid",
		tipo: "Técnica / necesaria",
		finalidade: "Manter a sesión activa e autenticar a persoa usuaria.",
		duracion: "Sesión",
		proveedor: "brasinda.com",
	},
	{
		cookie: "csrftoken",
		tipo: "Técnica / seguridade",
		finalidade: "Previr ataques CSRF en formularios e peticións autenticadas.",
		duracion: "12 meses",
		proveedor: "brasinda.com",
	},
	{
		cookie: "cookie_consent",
		tipo: "Técnica / preferencias",
		finalidade: "Gardar as preferencias sobre aceptación ou rexeitamento de cookies.",
		duracion: "12 meses",
		proveedor: "brasinda.com",
	},
	{
		cookie: "_ga",
		tipo: "Analítica",
		finalidade: "Distinguir persoas usuarias para obter estatísticas de navegación.",
		duracion: "13 meses",
		proveedor: "Google Analytics",
	},
	{
		cookie: "_ga_*",
		tipo: "Analítica",
		finalidade: "Medir interaccións e sesións dentro das páxinas do sitio.",
		duracion: "13 meses",
		proveedor: "Google Analytics",
	},
];

const cookiesSections = [
	{
		title: "1. Que son as cookies?",
		paragraphs: [
			"As cookies son ficheiros que se descargan no dispositivo do usuario ao acceder a determinadas páxinas web e permiten almacenar e recuperar información sobre a navegación.",
		],
	},
	{
		title: "2. Quen é o responsable?",
		paragraphs: [
			"O responsable das cookies propias desta web é Brasinda S.L., titular de brasinda.com, brasinda.es e brasinda.pt.",
			"Se tes dúbidas sobre esta política, podes contactar en eventos@brasinda.com.",
		],
	},
	{
		title: "3. Tipos de cookies que empregamos",
		paragraphs: [
			"Cookies técnicas e necesarias: son imprescindibles para o funcionamento básico da plataforma, como manter sesións abertas, xestionar a seguridade ou lembrar preferencias de navegación esenciais.",
			"Cookies de análise: permítennos entender como se utiliza o sitio web (por exemplo, páxinas máis visitadas, tempo de permanencia ou erros) para mellorar o servizo.",
			"Cookies de personalización: permiten lembrar opcións da persoa usuaria para ofrecer unha experiencia máis adaptada.",
			"Cookies de terceiros: determinados servizos integrados poden instalar cookies desde provedores externos, suxeitas ás súas propias políticas.",
		],
	},
	{
		title: "4. Finalidade das cookies",
		paragraphs: [
			"Garantir o funcionamento técnico da web.",
			"Mellorar rendemento, usabilidade e seguridade do servizo.",
			"Obter estatísticas agregadas de uso para optimizar contidos e funcionalidades.",
		],
	},
	{
		title: "5. Táboa de cookies",
		paragraphs: [
			"A continuación inclúese unha relación orientativa das principais cookies que pode empregar a plataforma. Pode variar en función de actualizacións técnicas, integracións de terceiros e configuración do navegador.",
		],
	},
	{
		title: "6. Base legal para o uso",
		paragraphs: [
			"As cookies técnicas e estritamente necesarias instálanse por interese lexítimo, ao ser indispensables para prestar o servizo solicitado.",
			"As cookies non necesarias (como as analíticas ou de personalización avanzada) só se utilizarán cando exista consentimento da persoa usuaria, de acordo coa normativa aplicable.",
		],
	},
	{
		title: "7. Conservación",
		paragraphs: [
			"Cada cookie ten un prazo de conservación específico, que pode variar segundo a súa finalidade e o provedor.",
			"As cookies de sesión elimínanse ao pechar o navegador; as persistentes poden conservarse durante un período determinado ata a súa caducidade ou eliminación manual.",
		],
	},
	{
		title: "8. Como configurar ou desactivar cookies",
		paragraphs: [
			"Podes aceptar, rexeitar ou retirar o consentimento sobre cookies non necesarias desde a configuración dispoñible na plataforma cando estea habilitada.",
			"Tamén podes bloquear ou eliminar cookies desde o teu navegador en calquera momento. Ten en conta que, se desactivas cookies técnicas, certas funcións da web poden non funcionar correctamente.",
		],
	},
	{
		title: "9. Cookies de terceiros",
		paragraphs: [
			"Este sitio pode integrar servizos de terceiros (por exemplo, autenticación, analítica, mapas ou contido incrustado) que poden xestionar cookies propias.",
			"Recoméndase consultar directamente as políticas destes provedores para coñecer o tratamento exacto da información.",
		],
	},
	{
		title: "10. Actualizacións da política",
		paragraphs: [
			"Esta Política de Cookies pode actualizarse para adaptarse a cambios legais, técnicos ou funcionais da plataforma.",
			"Última actualización: 30 de marzo de 2026.",
		],
	},
];

function PoliticaCookies() {
	const navigate = useNavigate();

	return (
		<>
			<MainNavbar />

			<div
				style={{
					background:
						"linear-gradient(180deg, rgba(255,0,147,0.08) 0%, rgba(255,255,255,1) 55%)",
					padding: "3rem 0 1rem",
				}}
			>
				<Container style={{ maxWidth: "960px" }}>
					<div
						style={{
							backgroundColor: "#ffffff",
							borderRadius: "28px",
							padding: "2.5rem",
							boxShadow: "0 18px 45px rgba(23, 30, 60, 0.08)",
							border: "1px solid rgba(255, 0, 147, 0.08)",
						}}
					>
						<p
							style={{
								color: "#ff0093",
								fontWeight: 700,
								textTransform: "uppercase",
								letterSpacing: "0.08em",
								marginBottom: "0.75rem",
								fontSize: "0.85rem",
							}}
						>
							Información legal
						</p>

						<h1
							style={{
								fontSize: "clamp(2rem, 4vw, 3.4rem)",
								fontWeight: 800,
								color: "#171717",
								marginBottom: "1rem",
							}}
						>
							Política de cookies
						</h1>

						<p
							style={{
								fontSize: "1.05rem",
								lineHeight: 1.8,
								color: "#4b5563",
								maxWidth: "760px",
								marginBottom: "1.5rem",
							}}
						>
							Nesta páxina explicamos que cookies usamos, para que serven e como podes
							xestionalas en relación coa túa privacidade e experiencia de navegación.
						</p>

						<Button
							variant="outline-dark"
							onClick={() => navigate(-1)}
							style={{ borderRadius: "999px", padding: "0.65rem 1.25rem" }}
						>
							Volver
						</Button>
					</div>

					<div style={{ marginTop: "1.5rem", display: "grid", gap: "1rem" }}>
						{cookiesSections.map((section) => (
							<section
								key={section.title}
								style={{
									backgroundColor: "#ffffff",
									borderRadius: "22px",
									padding: "1.75rem 1.5rem",
									border: "1px solid #ececf2",
									boxShadow: "0 12px 30px rgba(15, 23, 42, 0.04)",
								}}
							>
								<h2
									style={{
										fontSize: "1.2rem",
										fontWeight: 700,
										color: "#111827",
										marginBottom: "0.9rem",
									}}
								>
									{section.title}
								</h2>

								{section.paragraphs.map((paragraph) => (
									<p
										key={paragraph}
										style={{
											marginBottom: "0.9rem",
											color: "#4b5563",
											lineHeight: 1.8,
										}}
									>
										{paragraph}
									</p>
								))}

								{section.title.startsWith("5.") && (
									<div
										style={{
											overflowX: "auto",
											border: "1px solid #e5e7eb",
											borderRadius: "12px",
											marginTop: "0.75rem",
										}}
									>
										<table
											style={{
												width: "100%",
												borderCollapse: "collapse",
												minWidth: "760px",
												backgroundColor: "#ffffff",
											}}
										>
											<thead>
												<tr style={{ backgroundColor: "#f8fafc" }}>
													<th style={{ textAlign: "left", padding: "0.75rem", borderBottom: "1px solid #e5e7eb" }}>Cookie</th>
													<th style={{ textAlign: "left", padding: "0.75rem", borderBottom: "1px solid #e5e7eb" }}>Tipo</th>
													<th style={{ textAlign: "left", padding: "0.75rem", borderBottom: "1px solid #e5e7eb" }}>Finalidade</th>
													<th style={{ textAlign: "left", padding: "0.75rem", borderBottom: "1px solid #e5e7eb" }}>Duración</th>
													<th style={{ textAlign: "left", padding: "0.75rem", borderBottom: "1px solid #e5e7eb" }}>Proveedor</th>
												</tr>
											</thead>
											<tbody>
												{cookieTableRows.map((row) => (
													<tr key={row.cookie}>
														<td style={{ padding: "0.75rem", borderBottom: "1px solid #f1f5f9", color: "#111827", fontWeight: 600 }}>{row.cookie}</td>
														<td style={{ padding: "0.75rem", borderBottom: "1px solid #f1f5f9", color: "#374151" }}>{row.tipo}</td>
														<td style={{ padding: "0.75rem", borderBottom: "1px solid #f1f5f9", color: "#374151" }}>{row.finalidade}</td>
														<td style={{ padding: "0.75rem", borderBottom: "1px solid #f1f5f9", color: "#374151", whiteSpace: "nowrap" }}>{row.duracion}</td>
														<td style={{ padding: "0.75rem", borderBottom: "1px solid #f1f5f9", color: "#374151" }}>{row.proveedor}</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								)}
							</section>
						))}
					</div>
				</Container>
			</div>

			<Footer />
		</>
	);
}

export default PoliticaCookies;
