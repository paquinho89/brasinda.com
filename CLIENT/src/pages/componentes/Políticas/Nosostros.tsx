import { Container, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import MainNavbar from "../NavBar";
import Footer from "../footer";

const aboutSections = [
	{
		title: "Quen somos?",
		paragraphs: [
			"Somos unha plataforma pensada para impulsar o tecido cultural e social do noso territorio.",
			"Traballamos para que organizadores, asociacións, salas e público se atopen nun mesmo espazo dixital simple, útil e próximo.",
		],
	},
	{
		title: "Que facemos?",
		paragraphs: [
			"A plataforma permite cubrir todo o ciclo dun evento dun xeito claro e centralizado:",
		],
		items: ["Publicar eventos", "Reservar entradas", "Xestionar asistentes"],
	},
	{
		title: "A nosa misión",
		paragraphs: [
			"Queremos facilitar que calquera persoa poida descubrir e participar nas actividades do seu entorno, ao tempo que axudamos aos organizadores a profesionalizar a xestión dos seus eventos.",
		],
		items: [
			"Promover eventos locais",
			"Axudar a organizadores coa xestión das reservas",
			"Conectar a xente coas actividades do seu entorno",
			"Facilitar a compra de entradas",
			"Apoiar a cultura local",
		],
	},
	{
		title: "Como funciona a plataforma?",
		paragraphs: [
			"1) O organizador crea e publica o evento con toda a información relevante.",
			"2) O público busca eventos por interese, data ou localización e reserva en poucos pasos.",
			"3) O organizador consulta a asistencia e xestiona as reservas desde o seu panel.",
		],
	},
	{
		title: "Contacto",
		paragraphs: [
			"Se queres colaborar, publicar eventos ou resolver dúbidas, estamos dispoñibles en:",
			"eventos@brasinda.com",
		],
	},
];

function Nosostros() {
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
							Coñécenos
						</p>

						<h1
							style={{
								fontSize: "clamp(2rem, 4vw, 3.4rem)",
								fontWeight: 800,
								color: "#171717",
								marginBottom: "1rem",
							}}
						>
							Sobre nós
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
							Un espazo para conectar persoas e eventos en Galicia, simplificando a
							xestión para organizadores e mellorando a experiencia de reserva para o
							público.
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
						{aboutSections.map((section) => (
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

								{section.paragraphs?.map((paragraph) => (
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

								{section.items && (
									<ul style={{ margin: 0, paddingLeft: "1.2rem", color: "#374151" }}>
										{section.items.map((item) => (
											<li key={item} style={{ marginBottom: "0.5rem", lineHeight: 1.6 }}>
												{item}
											</li>
										))}
									</ul>
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

export default Nosostros;
