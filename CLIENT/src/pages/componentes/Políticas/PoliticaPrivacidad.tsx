import { Container, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import MainNavbar from "../NavBar";
import Footer from "../footer";

const sections = [
	{
		title: "1. Quen somos?",
		paragraphs: [
			"Titular: Brasinda S.L.",
            "Enderezo: Avenida de Castela Nº151 Verín (Ourense)",
            "Correo electrónico: eventos@brasinda.com",
            "Sitio web: brasinda.com brasinda.es brasinda.pt ",
		],
	},
	{
		title: "2. Datos que podemos recoller",
		paragraphs: [
			"Podemos tratar datos identificativos e de contacto, como nome, apelidos, correo electrónico, número de conta bancaria, teléfono e información asociada á conta de usuario ou organizador.",
			"No proceso de compra ou reserva tamén se poden tratar datos da operación, datos do evento seleccionado, información de facturación e calquera información adicional que a persoa usuaria facilite voluntariamente.",
			"Se accedes mediante provedores externos, como Google, poderemos recibir os datos mínimos necesarios para autenticar a túa identidade, como nome e correo electrónico.",
		],
	},
	{
		title: "3. Finalidades do tratamento",
		paragraphs: [
			"Os datos utilízanse para xestionar o rexistro de contas, permitir o acceso á área privada, publicar e administrar eventos, procesar reservas e enviar comunicacións relacionadas coa actividade contratada.",
			"Tamén poderemos utilizar a información para atender consultas, xestionar incidencias técnicas, previr usos fraudulentos e cumprir coas obrigas legais aplicables.",
		],
	},
	{
		title: "4. Base xurídica",
		paragraphs: [
			"Se creas unha conta, publicas un evento ou compras/reservas unha entrada hai un contrato implícito entre tú e a plataforma.",
            "Para poder facer eso, necesitamos usar os teus datos (nome, email, pago, conta bancaria...) e non necesitamos pedir o teu consentimento para tales accións xa que é necesario para poder prestarche o servizo.",
			"Noutros casos, o tratamento poderá basearse no consentimento outorgado, e dicir que tú aceptes recibir a nosa newsletter,", 
            "Que teñamos que cumplir obligacións legais como guardar facturas, dar datos a Hacienda no caso de que sexa necesario ou cumplir a normativa de consumo.",
            "ou por interés lexítimo como será a seguridade e mellora da plataforma, prevención de fraudes ou para estadísticas internas."

		],
	},
	{
		title: "5. Conservación dos datos",
		paragraphs: [
			"Os datos conservaranse durante o tempo necesario para prestar o servizo, atender reclamacións, cumprir obrigas fiscais, contables ou administrativas e defender posibles responsabilidades legais.",
			"Cando os datos deixen de ser necesarios, serán eliminados ou bloqueados conforme á normativa vixente.",
		],
	},
	{
		title: "6. Cesións e acceso por terceiros",
		paragraphs: [
			"Non se venderán datos persoais a terceiros. Poderán acceder a eles provedores tecnolóxicos, pasarelas de pagamento (Mollie), servizos de autenticación (Google), aloxamento (Railway), servizo de emails(MailGun), soporte técnico, ou servizos na nube, sempre baixo instrucións do responsable e coa correspondente relación contractual.",
			"Os datos tamén poderán comunicarse cando exista unha obriga legal (Facenda, xuíces / tribunais, policía ou administración pública) ou sexa necesario para a formulación, exercicio ou defensa de reclamacións (se alguén denuncia, se hai fraude, se hai un problema cos pagos, se hai un xuízo ou para defenderse legalmente).",
		],
	},
	{
		title: "7. Dereitos das persoas usuarias",
		paragraphs: [
			"As persoas interesadas poden exercer os dereitos de acceso, rectificación, supresión, limitación do tratamento, oposición e portabilidade dos seus datos, dirixíndose ao responsable mediante correo electrónico a eventos@brasinda.com.",
            "Así mesmo, teñen dereito a presentar unha reclamación ante a Axencia Española de Protección de Datos (AEPD) se consideran que o tratamento non se axusta á normativa vixente."
		],
	},
	{
		title: "8. Seguridade da información",
		paragraphs: [
			"A plataforma adopta medidas técnicas e organizativas razoables para protexer os datos fronte a accesos non autorizados, perda, alteración ou divulgación indebida.",
			"Non obstante, ningunha transmisión por internet é completamente invulnerable, polo que non pode garantirse unha seguridade absoluta en todos os supostos.",
		],
	},
	{
		title: "9. Menores de idade",
		paragraphs: [
			"Os servizos non están dirixidos a menores que non conten coa autorización legalmente esixible. Se detectamos que se achegaron datos persoais de menores sen base lexítima, poderemos proceder á súa eliminación.",
		],
	},
	{
		title: "10. Cookies e tecnoloxías semellantes",
		paragraphs: [
			"A utilización de cookies e tecnoloxías afíns rexerase pola política específica de cookies da plataforma, onde se explican os tipos empregados, a súa finalidade e a forma de xestionar as preferencias.",
		],
	},
	{
		title: "11. Actualizacións desta política",
		paragraphs: [
			"Esta política poderá actualizarse para adaptarse a cambios legais, técnicos ou funcionais do servizo. Recoméndase revisala periodicamente.",
			"Última actualización: 30 de marzo de 2026.",
		],
	},
];

function PoliticaPrivacidad() {
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
							Política de privacidade
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
							En brasinda.com comprometémonos a tratar os datos persoais de forma
							lícita, leal e transparente. Nesta páxina explicamos que información
							recollimos, para que a empregamos e que dereitos tes como persoa usuaria
							da plataforma.
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
						{sections.map((section) => (
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
							</section>
						))}
					</div>

					<div
						style={{
							marginTop: "1.5rem",
							backgroundColor: "#171717",
							color: "#ffffff",
							borderRadius: "22px",
							padding: "1.5rem",
						}}
					>
						<h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.75rem" }}>
							Contacto para protección de datos
						</h2>
						<p style={{ marginBottom: 0, lineHeight: 1.8, color: "rgba(255,255,255,0.82)" }}>
							Se tes dúbidas sobre esta política ou queres exercer os teus dereitos,
							podes contactar a través das canles publicadas na plataforma ou no correo
							de atención dispoñible para usuarios e organizadores.
						</p>
					</div>
				</Container>
			</div>

			<Footer />
		</>
	);
}

export default PoliticaPrivacidad;
