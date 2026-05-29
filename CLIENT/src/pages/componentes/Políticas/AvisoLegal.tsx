import { Container, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import MainNavbar from "../NavBar";
import Footer from "../footer";

const legalSections = [
	{
		title: "1. Datos identificativos",
		paragraphs: [
			"Titular: Brasinda S.L.",
			"Enderezo: Avenida de Castela Nº 151, Verín (Ourense).",
            "NIF: XXXXXXXXX",
            "Datos de inscripción en el Registro Mercantil (tomo, folio, sección, hoja, inscripción): XXXXXXX",
			"Correo electrónico: eventos@brasinda.com.",
			"Sitios web asociados: brasinda.com, brasinda.es e brasinda.pt.",
		],
	},
	{
		title: "2. Obxecto do sitio web",
		paragraphs: [
			"Este sitio web ofrece servizos de publicación, xestión e promoción de eventos, así como funcionalidades para a reserva e compra de entradas por parte dos usuarios.",
			"O acceso e uso da plataforma atribúe a condición de persoa usuaria e implica a aceptación das condicións de uso vixentes en cada momento.",
		],
	},
	{
		title: "3. Condicións de uso",
		paragraphs: [
			"A navegación polo sitio web debe realizarse de boa fe e respectando a finalidade informativa e funcional da plataforma.",
			"Non se permite a extracción masiva de contido, a enxeñaría inversa, a alteración técnica do servizo nin calquera actuación que comprometa a estabilidade, dispoñibilidade ou seguridade da web.",
			"O titular poderá adoptar medidas técnicas de protección, restrinxir accesos automáticos non autorizados e bloquear temporalmente funcionalidades para preservar a integridade do sistema.",
		],
	},
	{
		title: "4. Contidos e responsabilidade",
		paragraphs: [
			"A información publicada no sitio web ten carácter xeral e pode estar suxeita a actualizacións, modificacións ou correccións.",
			"Os organizadores son responsables da veracidade, exactitude e legalidade dos datos dos eventos que publiquen.",
			"O titular non garante a dispoñibilidade permanente do servizo nin a ausencia absoluta de erros, interrupcións ou incidencias técnicas, sen prexuízo das obrigas legais que resulten aplicables.",
		],
	},
	{
		title: "5. Propiedade intelectual e industrial",
		paragraphs: [
			"Todos os contidos do sitio web, incluíndo textos, deseños, imaxes, logotipos, marcas, software e código fonte, están protexidos pola normativa de propiedade intelectual e industrial.",
			"A reprodución, distribución, comunicación pública, transformación ou calquera outra forma de explotación non autorizada queda prohibida, salvo consentimento expreso do titular ou cando estea legalmente permitido.",
		],
	},
	{
		title: "6. Ligazóns externas",
		paragraphs: [
			"Este sitio web pode incluír ligazóns a páxinas de terceiros para facilitar información adicional ou servizos complementarios.",
			"O titular non se responsabiliza dos contidos, políticas ou prácticas destes sitios externos nin dos danos que poidan derivarse do seu uso.",
		],
	},
	{
		title: "7. Protección de datos e cookies",
		paragraphs: [
			"O tratamento de datos persoais realízase conforme ao indicado na Política de Privacidade da plataforma.",
			"O uso de cookies e tecnoloxías similares regúlase na Política de Cookies, onde se especifican os tipos de cookies, finalidades e opcións de configuración.",
		],
	},
	{
		title: "8. Lexislación aplicable e xurisdición",
		paragraphs: [
			"Este aviso legal réxese pola lexislación española.",
			"Para a resolución de conflitos derivados do uso do sitio web, as partes someteranse aos xulgados e tribunais competentes segundo a normativa vixente, con especial atención aos dereitos das persoas consumidoras.",
		],
	},
	{
		title: "9. Modificación do aviso legal",
		paragraphs: [
			"O titular resérvase o dereito a modificar este aviso legal para adaptalo a cambios normativos, técnicos ou funcionais do servizo.",
			"Última actualización: 30 de marzo de 2026.",
		],
	},
];

function AvisoLegal() {
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
							Aviso legal
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
							Este aviso legal regula o acceso e uso do sitio web, define as
							responsabilidades básicas das partes e informa sobre o marco xurídico
							aplicable á actividade da plataforma.
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
						{legalSections.map((section) => (
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
				</Container>
			</div>

			<Footer />
		</>
	);
}

export default AvisoLegal;
