import React, { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Button, Form, Container, Card } from "react-bootstrap";
import type { OutletContext } from "./0ElementoPadre";
import { FaArrowLeft, FaIdCard, FaPhone, FaUser, FaMapMarkerAlt } from "react-icons/fa";


const CondicionesLegales: React.FC = () => {
  const { evento, setEvento } = useOutletContext<OutletContext>();
  const [aceptacionCondiciones, setAceptacionCondiciones] =
    useState<boolean>(evento.condicionesConfirmacion || false);
  const [nomeCompleto, setNomeCompleto] = useState(evento.nomeCompleto || "");
  const [nifCif, setNifCif] = useState(evento.nifCif || "");
  // Recuperar enderezo fiscal descomposto se existe
  let estradaDefault = "", numeroDefault = "", portaPisoDefault = "", localidadeDefault = "", codigoPostalDefault = "";
  if (evento.enderezoFiscal) {
    // Exemplo: "Rúa X, 12, 3ºB, Cidade, 15000"
    const partes = evento.enderezoFiscal.split(",").map(p => p.trim());
    estradaDefault = partes[0] || "";
    numeroDefault = partes[1] || "";
    if (partes.length === 5) {
      portaPisoDefault = partes[2] || "";
      localidadeDefault = partes[3] || "";
      codigoPostalDefault = partes[4] || "";
    } else {
      portaPisoDefault = "";
      localidadeDefault = partes[2] || "";
      codigoPostalDefault = partes[3] || "";
    }
  }
  const [estrada, setEstrada] = useState(estradaDefault);
  const [numero, setNumero] = useState(numeroDefault);
  const [portaPiso, setPortaPiso] = useState(portaPisoDefault);
  const [localidade, setLocalidade] = useState(localidadeDefault);
  const [codigoPostal, setCodigoPostal] = useState(codigoPostalDefault);
  const [telefono, setTelefono] = useState(evento.telefono || "");
    const [errorTelefono, setErrorTelefono] = useState("");
    const validarTelefono = (telefono:string) => {
      const expresionRegular = /^\+?[\d\s\-()]+$/;
      return expresionRegular.test(telefono);
    }
  const [prefixo, setPrefixo] = useState("+34");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});
  const navigate = useNavigate();


  const handleSubmit = async () => {
    // Marcar todos como tocados ao intentar avanzar
    setTouched(t => ({
      ...t,
      nomeCompleto: true,
      nifCif: true,
      telefono: true,
      estrada: true,
      numero: true,
      localidade: true,
      codigoPostal: true
      // portaPiso non é obrigatorio
    }));

      if (!validarTelefono(telefono)){
    setErrorTelefono("invalido");
    return false;
  }

    if (!aceptacionCondiciones) {
      setError("Por favor, acepta as condicións legais");
      return;
    }

    // Validación campo a campo
    if (
      nomeCompleto.trim() === "" ||
      nifCif.trim() === "" ||
      telefono.trim() === "" ||
      estrada.trim() === "" ||
      numero.trim() === "" ||
      localidade.trim() === "" ||
      codigoPostal.trim() === ""
      // portaPiso non é obrigatorio
    ) {
      setError("Debes cubrir todos os campos obrigatorios.");
      return;
    }

    setError("");

    // Agrupar enderezo fiscal
    const enderezoFiscal = `${estrada}, ${numero}${portaPiso ? ", " + portaPiso : ""}, ${localidade}, ${codigoPostal}`;


    // Enviar PATCH autenticado ao backend
    try {
      await fetch("/api/organizador/perfil/", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          nome_razon_social_contrato: nomeCompleto,
          nif_cif: nifCif,
          enderezo_fiscal: enderezoFiscal,
          telefono,
        }),
      });
    } catch (e) {
      setError("Erro ao gardar os datos do contrato.");
      return;
    }

    const eventoActualizado = {
      ...evento,
      condicionesConfirmacion: aceptacionCondiciones,
      nomeCompleto,
      nifCif,
      enderezoFiscal,
      telefono,
    };
    setEvento(eventoActualizado);
    localStorage.setItem("eventoDraft", JSON.stringify(eventoActualizado));
    navigate("/crear-evento/resumen");
  };

  return (
    <Container className="py-5 d-flex justify-content-center">
      <Card
        className="shadow-sm"
        style={{ maxWidth: "600px", width: "100%" }}
      >
        <Card.Body className="p-4">
            <h3 className="text-center mb-4">Contrato de colaboración</h3>

            <div className="mb-4" style={{ whiteSpace: "pre-line" }}>
              <h4>REUNIDOS</h4>
              Dunha parte, Eventos Brasinda, con NIF [●], titular da web brasinda.com, en adiante “a Plataforma”.
              E doutra parte, [NOME DO ORGANIZADOR], con NIF/CIF xxxxxxx e domicilio en xxxxxx, en adiante “o Organizador”.
              Ambas partes recoñécense capacidade legal suficiente e

              <h5 style={{marginTop: '0.5rem'}}>EXPOÑEN</h5>
              Que a Plataforma ofrece un servizo tecnolóxico de publicación e venda de entradas para eventos a través dunha páxina web.
              Que o Organizador é responsable da planificación, xestión e execución do evento descrito.
              Que ambas partes desexan regular a súa relación de colaboración exclusivamente para a venda de entradas do evento.

              <div style={{marginTop: '2.5rem'}} />
              <h4>CLÁUSULAS</h4>
              <div style={{marginTop: '2.5rem'}} />
              <h5>1. OBXECTO DO CONTRATO</h5>
              O presente contrato regula a colaboración para a publicación e venda de entradas do seguinte evento:
              <ul>
                <li>Nome do evento: [●]</li>
                <li>Data e hora: [●]</li>
                <li>Lugar: [●]</li>
              </ul>

              <h5>2. ROL DA PLATAFORMA</h5>
              A Plataforma actúa unicamente como intermediario tecnolóxico, proporcionando:
              <ul>
                <li>Publicación do evento na web</li>
                <li>Sistema de venda de entradas</li>
                <li>Xestión técnica dos pagos</li>
              </ul>
              <strong>A Plataforma non é organizadora nin promotora do evento.</strong>

              <div style={{marginTop: '2.5rem'}} />
              <h5>3. RESPONSABILIDADE DO ORGANIZADOR</h5>
              O Organizador é o único responsable de:
              <ul>
                <li>A legalidade do evento e permisos necesarios</li>
                <li>Seguridade, licenzas e cumprimento normativo</li>
                <li>Execución e realización do evento</li>
                <li>Contido, artistas ou actividades do evento</li>
                <li>Atención ao público e reclamacións</li>
              </ul>

              <h5>4. PAGOS E LIQUIDACIÓN</h5>
              Os ingresos pola venda de entradas serán:
              <ul>
                <li>Recolleitos a través da plataforma de pagamento</li>
                <li>Transferidos ao Organizador descontadas as comisións acordadas: [●]% ou importe fixo</li>
                <li>A Plataforma realizará a liquidación no prazo de [●] días tras o evento ou segundo acordo</li>
              </ul>

              <h5>5. CANCELACIÓNS E DEVOLUCIÓNS</h5>
              O Organizador será responsable de:
              <ul>
                <li>Definir a política de devolucións</li>
                <li>Xestionar cancelacións ou cambios de data</li>
                <li>Asumir os custos derivados das devolucións</li>
              </ul>
              A Plataforma executará as devolucións unicamente segundo instrucións do Organizador ou obrigas legais.

              <div style={{marginTop: '2.5rem'}} />
              <h5>6. PROTECCIÓN E INDEMNIZACIÓN</h5>
              O Organizador comprométese a manter indemne á Plataforma fronte a:
              <ul>
                <li>Reclamacións de asistentes</li>
                <li>Sancións administrativas derivadas do evento</li>
                <li>Danos ou incidentes durante o evento</li>
                <li>Incumprimentos legais do Organizador</li>
              </ul>

              <div style={{marginTop: '2.5rem'}} />
              <h5>7. DATOS E VERACIDADE</h5>
              O Organizador declara que toda a información proporcionada é veraz e que dispón de autorizacións e permisos necesarios.

              <div style={{marginTop: '2.5rem'}} />
              <h5>8. PROPIEDADE E USO DA PLATAFORMA</h5>
              A Plataforma mantén todos os dereitos sobre o software e sistema de venda de entradas.

              <div style={{marginTop: '2.5rem'}} />
              <h5>9. DURACIÓN</h5>
              Este contrato é válido exclusivamente para o evento indicado e remata tras a súa finalización e liquidación.

              <div style={{marginTop: '2.5rem'}} />
              <h5>10. LEI APLICABLE</h5>
              Este contrato rexerase pola lexislación española. Calquera conflito someterase aos xulgados de [cidade/provincia].
            </div>

          <Form>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Lin e acepto o contrato de colaboración"
                checked={aceptacionCondiciones}
                onChange={(e) =>
                  setAceptacionCondiciones(e.target.checked)
                }
              />
            </Form.Group>

            {aceptacionCondiciones && (
              <>
                <Form.Group className="mb-3">
                  <FaUser style={{ marginRight: "6px", color: "#ff0093" }} />
                  <Form.Label><strong>Nome Completo / Razón Social</strong></Form.Label>
                  <Form.Control
                    type="text"
                    value={nomeCompleto}
                    onChange={e => setNomeCompleto(e.target.value)}
                    onBlur={() => setTouched(t => ({ ...t, nomeCompleto: true }))}
                    placeholder="Introduce o teu nome completo ou razón social"
                  />
                  {touched.nomeCompleto && nomeCompleto.trim() === "" && (
                    <div className="text-danger small">Este campo é obrigatorio</div>
                  )}
                </Form.Group>
                <Form.Group className="mb-3">
                  <FaIdCard style={{ marginRight: "6px", color: "#ff0093" }} />
                  <Form.Label><strong>NIF / CIF</strong></Form.Label>
                  <Form.Control
                    type="text"
                    value={nifCif}
                    onChange={e => setNifCif(e.target.value)}
                    onBlur={() => setTouched(t => ({ ...t, nifCif: true }))}
                    placeholder="Introduce o teu NIF ou CIF"
                  />
                  {touched.nifCif && nifCif.trim() === "" && (
                    <div className="text-danger small">Este campo é obrigatorio</div>
                  )}
                </Form.Group>
                <div className="mb-3 d-flex gap-2 align-items-end">
                  <Form.Group style={{maxWidth: "110px"}}>
                    <FaPhone style={{ marginRight: "6px", color: "#ff0093" }} />
                    <Form.Label className="mb-1"><strong>Prefixo</strong></Form.Label>
                    <Form.Control
                      type="text"
                      value={prefixo}
                      onChange={e => setPrefixo(e.target.value)}
                      placeholder="+34"
                    />
                  </Form.Group>
                  <Form.Group style={{flex: 1}}>
                    <Form.Label><strong>Número de teléfono</strong></Form.Label>
                    <Form.Control 
                      type="text" 
                      placeholder="666..."
                      value={telefono}
                      onChange={(e)=> {
                        const value = e.target.value; // solo números
                        setTelefono(value);
                        if (value && !validarTelefono(value)){
                          setErrorTelefono("invalido");
                        } else {
                          setErrorTelefono("");
                        }
                      }}
                    />
                    {errorTelefono === "invalido" && (
                      <div className="text-danger small mt-1">
                        Introduce un número de teléfono válido
                      </div>
                    )}
                  </Form.Group>
                </div>
                <div className="mb-3">
                  <div className="mb-2">
                    <FaMapMarkerAlt style={{ marginRight: "6px", color: "#ff0093" }} />
                    <strong>Enderezo fiscal</strong></div>
                  <Form.Group className="mb-2">
                    <Form.Label className="mb-1">Estrada / Rúa</Form.Label>
                    <Form.Control
                      type="text"
                      value={estrada}
                      onChange={e => setEstrada(e.target.value)}
                      onBlur={() => setTouched(t => ({ ...t, estrada: true }))}
                      placeholder="Estrada ou rúa"
                    />
                    {touched.estrada && estrada.trim() === "" && (
                      <div className="text-danger small">Este campo é obrigatorio</div>
                    )}
                  </Form.Group>
                  <div className="mb-2 d-flex gap-2">
                    <Form.Group style={{flex: 1}}>
                      <Form.Label className="mb-1">Número</Form.Label>
                      <Form.Control
                        type="text"
                        value={numero}
                        onChange={e => setNumero(e.target.value)}
                        onBlur={() => setTouched(t => ({ ...t, numero: true }))}
                        placeholder="Número"
                      />
                      {touched.numero && numero.trim() === "" && (
                        <div className="text-danger small">Este campo é obrigatorio</div>
                      )}
                    </Form.Group>
                    <Form.Group style={{flex: 1}}>
                      <Form.Label className="mb-1">Porta / Piso</Form.Label>
                      <Form.Control
                        type="text"
                        value={portaPiso}
                        onChange={e => setPortaPiso(e.target.value)}
                        placeholder="Porta ou piso (opcional)"
                      />
                    </Form.Group>
                  </div>
                  <div className="mb-2 d-flex gap-2">
                    <Form.Group style={{flex: 1}}>
                      <Form.Label className="mb-1">Localidade</Form.Label>
                      <Form.Control
                        type="text"
                        value={localidade}
                        onChange={e => setLocalidade(e.target.value)}
                        onBlur={() => setTouched(t => ({ ...t, localidade: true }))}
                        placeholder="Localidade"
                      />
                      {touched.localidade && localidade.trim() === "" && (
                        <div className="text-danger small">Este campo é obrigatorio</div>
                      )}
                    </Form.Group>
                    <Form.Group style={{flex: 1}}>
                      <Form.Label className="mb-1">Código Postal</Form.Label>
                      <Form.Control
                        type="text"
                        value={codigoPostal}
                        onChange={e => setCodigoPostal(e.target.value)}
                        onBlur={() => setTouched(t => ({ ...t, codigoPostal: true }))}
                        placeholder="Código Postal"
                      />
                      {touched.codigoPostal && codigoPostal.trim() === "" && (
                        <div className="text-danger small">Este campo é obrigatorio</div>
                      )}
                    </Form.Group>
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="text-danger mb-3">{error}</div>
            )}

            <div className="d-flex justify-content-between mt-4">
              <Button
                className="boton-avance"
                onClick={() => navigate(-1)}
              >
                <FaArrowLeft className="me-2" />
                Volver
              </Button>

              <Button
                className="reserva-entrada-btn"
                onClick={handleSubmit}
                disabled={
                  !aceptacionCondiciones ||
                  nomeCompleto.trim() === "" ||
                  nifCif.trim() === "" ||
                  telefono.trim() === "" ||
                  estrada.trim() === "" ||
                  numero.trim() === "" ||
                  localidade.trim() === "" ||
                  codigoPostal.trim() === ""
                  // portaPiso non bloquea
                }
              >
                Firmar Contrato
              </Button>
            </div>
          </Form>

        </Card.Body>
      </Card>
    </Container>
  );
};

export default CondicionesLegales;
