
import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Button, Form, Container, Card, Row, Col } from "react-bootstrap";
import type { OutletContext } from "./0ElementoPadre";
import { FaArrowLeft, FaBriefcase, FaIdCard, FaPhone, FaMapMarkerAlt, FaTag, FaUser } from "react-icons/fa";
import API_BASE_URL from "../../utils/api";
import "react-datepicker/dist/react-datepicker.css";
import "../../estilos/datepicker-custom.css";




const CondicionesLegales: React.FC = () => {
  const { evento, setEvento } = useOutletContext<OutletContext>();
  const { organizador, token } = useAuth();
  const [aceptacionCondiciones, setAceptacionCondiciones] =
    useState<boolean>(evento.condicionesConfirmacion || false);
  const [nifCif, setNifCif] = useState(evento.nifCif || "");

  const parsePriceValue = (value: string | number | null | undefined) => {
    if (value === undefined || value === null || value === "") return NaN;
    if (typeof value === "number") return value;
    return Number(String(value).replace(",", "."));
  };

  const formatEuro = (value: number) =>
    `${value.toLocaleString("gl-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} €`;

  const precioRecibesNum = parsePriceValue(evento.prezo_recibe_organizador);
  const precioVentaNum = parsePriceValue(evento.prezo_venta);
  const prezoBaseNum = parsePriceValue(evento.prezo_base);
  const gastosXestionNum = !Number.isNaN(precioRecibesNum) && !Number.isNaN(precioVentaNum)
    ? Math.abs(precioVentaNum - precioRecibesNum)
    : NaN;

  const ivaRate = evento.iveRate ?? 0;

  const importeRecibidoPorEntrada = !Number.isNaN(precioRecibesNum)
    ? formatEuro(precioRecibesNum)
    : "[por cubrir]";
  const gastosXestion = !Number.isNaN(gastosXestionNum)
    ? formatEuro(gastosXestionNum)
    : "[por cubrir]";
  const ivaAmountNum = !Number.isNaN(prezoBaseNum)
    ? prezoBaseNum * ivaRate
    : NaN;
  const ivaTexto = !Number.isNaN(ivaAmountNum)
    ? `${formatEuro(ivaAmountNum)} (${Math.round(ivaRate * 100)}%)`
    : "[por cubrir]";
  const prezoBaseFormatted = !Number.isNaN(prezoBaseNum)
    ? prezoBaseNum.toLocaleString("gl-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "[por cubrir]";
  const gastosBaseNum = !Number.isNaN(prezoBaseNum)
    ? prezoBaseNum * 0.05
    : NaN;
  const gastosIveNum = !Number.isNaN(gastosBaseNum)
    ? gastosBaseNum * 0.21
    : NaN;
  const gastosBaseTexto = !Number.isNaN(gastosBaseNum)
    ? gastosBaseNum.toLocaleString("gl-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "€"
    : "[por cubrir]";
  const gastosIveTexto = !Number.isNaN(gastosIveNum)
    ? gastosIveNum.toLocaleString("gl-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "€"
    : "[por cubrir]";
  const fmtGastos = !Number.isNaN(gastosBaseNum) && !Number.isNaN(gastosIveNum)
    ? (gastosBaseNum + gastosIveNum).toLocaleString("gl-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "[por cubrir]";
  const prezoVentaTexto = !Number.isNaN(precioVentaNum)
    ? formatEuro(precioVentaNum)
    : "[por cubrir]";

  const isGratis = evento.tipo_gestion_entrada === "gratis" || (
    (!evento.prezo_recibe_organizador || parseFloat(String(evento.prezo_recibe_organizador).replace(",", ".")) === 0) &&
    (!evento.precios_zona || Object.values(evento.precios_zona).every(p => parseFloat(String(p).replace(",", ".")) === 0))
  );

  const organizerAsumeGastos = evento.asumeFees === true;
  const isManualGestion = evento.tipo_gestion_entrada === "manual";
  const prezoBaseTexto = !Number.isNaN(prezoBaseNum)
    ? formatEuro(prezoBaseNum)
    : "[por cubrir]";
  const formulaRecibe = organizerAsumeGastos
    ? `${prezoBaseTexto} + ${ivaTexto} - ${gastosXestion}`
    : `${prezoBaseTexto} + ${ivaTexto}`;
  const formulaVenta = organizerAsumeGastos
    ? `${prezoBaseTexto} + ${ivaTexto}`
    : `${prezoBaseTexto} + ${ivaTexto} + ${gastosXestion}`;

  const formatEventoFecha = (fecha: string) => {
    const data = new Date(fecha);
    if (Number.isNaN(data.getTime())) return "[por cubrir]";

    const day = String(data.getDate()).padStart(2, "0");
    const monthNames = [
      "Xan",
      "Feb",
      "Mar",
      "Abr",
      "Mai",
      "Xuñ",
      "Xul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dec",
    ];
    const month = monthNames[data.getMonth()] || "";
    const year = data.getFullYear();

    let hora = "";
    if (fecha.includes("T")) {
      const partes = fecha.split("T");
      if (partes[1]) hora = partes[1].slice(0, 5);
    }

    return `${day}-${month}-${year}${hora ? " ás " + hora + " horas" : ""}`;
  };

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
  const [nomeOrganizador, setNomeOrganizador] = useState(evento.nome_organizador || "");
  const [apelidosOrganizador, setApelidosOrganizador] = useState(evento.apelidos_organizador || "");
  const [tipoOrganizador, setTipoOrganizador] = useState(evento.tipo_organizador || "");
  const [nomeEmpresa, setNomeEmpresa] = useState(evento.nome_empresa || "");
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});
  const navigate = useNavigate();


  const handleSubmit = async () => {
    // Marcar todos como tocados ao intentar avanzar
    setTouched(t => ({
      ...t,
      nomeOrganizador: true,
      apelidosOrganizador: true,
      tipoOrganizador: true,
      nomeEmpresa: true,
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
      nomeOrganizador.trim() === "" ||
      apelidosOrganizador.trim() === "" ||
      tipoOrganizador.trim() === "" ||
      nomeEmpresa.trim() === "" ||
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


    // Enviar PATCH autenticado ao backend real
    try {
      await fetch(`${API_BASE_URL}/organizador/perfil/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          nome_organizador: nomeOrganizador,
          apelidos_organizador: apelidosOrganizador,
          tipo_organizador: tipoOrganizador,
          nome_empresa: nomeEmpresa,
          nif_cif: nifCif,
          enderezo_fiscal: enderezoFiscal,
          telefono,
        }),
      });
    } catch (e) {
      setError("Erro ao gardar os datos do contrato.");
      return;
    }

    // Gardar tamén os datos fiscais no eventoDraft para manter ao volver atrás
    const eventoActualizado = {
      ...evento,
      condicionesConfirmacion: aceptacionCondiciones,
      nome_organizador: nomeOrganizador,
      apelidos_organizador: apelidosOrganizador,
      tipo_organizador: tipoOrganizador,
      nome_empresa: nomeEmpresa,
      nifCif,
      enderezoFiscal: `${estrada}, ${numero}${portaPiso ? ", " + portaPiso : ""}, ${localidade}, ${codigoPostal}`,
      telefono,
    };
    setEvento(eventoActualizado);
    localStorage.setItem("eventoDraft", JSON.stringify(eventoActualizado));
    navigate("/crear-evento/resumen");
  };

  return (
    <Container className="py-5 px-3 d-flex justify-content-center">
      <Card
        className="shadow-sm"
        style={{ maxWidth: "600px", width: "100%" }}
      >
        <Card.Body className="p-4">
            <h3 className="text-center mb-4">Contrato de colaboración</h3>

            <div className="mb-4" style={{ whiteSpace: "pre-line" }}>
              <h4>REUNIDOS</h4>
              Dunha parte, Francisco Álvarez González, con NIF 34628886V, maior de idade e con enderezo fiscal Estrada de Castela Nº 151 Verín (Ourense) e representante de Eventos Brasinda, en adiante “a Plataforma”.
              E doutra parte, {(organizador && organizador.nome_organizador) ? organizador.nome_organizador : "[por cubrir]"}, maior de idade e con email {(organizador && organizador.email) ? organizador.email : "[por cubrir]"}, en adiante “o Organizador”.
              Ambas partes recoñécense capacidade legal suficiente e

              <h5 style={{marginTop: '0.5rem'}}>EXPOÑEN</h5>
              que a Plataforma ofrece un servizo tecnolóxico de publicación e venda/reserva de entradas para eventos a través dunha páxina web.
              Que o Organizador é responsable da planificación, xestión e execución do evento descrito.
              Que ambas partes desexan regular a súa relación de colaboración exclusivamente para a venda ou reserva de entradas do evento.

              <div style={{marginTop: '2.5rem'}} />
              <h4>CLÁUSULAS</h4>
              <div style={{marginTop: '2.5rem'}} />
              <h5>1. OBXECTO DO CONTRATO</h5>
              O presente contrato regula a colaboración para a publicación, venda ou reserva de entradas do seguinte evento:

              <ul>
                <li>Nome do evento: <strong>{evento.tituloEvento || "[por cubrir]"}</strong></li>
                <li>Data e hora: <strong>{evento.fecha ? formatEventoFecha(evento.fecha) : "[por cubrir]"}</strong></li>
                <li>Lugar: <strong>{evento.lugar || "[por cubrir]"}</strong></li>
                {!isGratis && !isManualGestion && (
                  <>
                    <li>Prezo base: <strong>{!Number.isNaN(prezoBaseNum) ? formatEuro(prezoBaseNum) : "[por cubrir]"}</strong></li>
                    <li>
                      Gastos de xestión: <strong>{gastosXestion}</strong>
                      <span style={{ fontSize: "0.9rem", color: "#6c757d", marginLeft: "0.75rem" }}>
                        &rarr; {gastosBaseTexto} (5%) + {gastosIveTexto} (IVE da xestión 21%)
                      </span>
                    </li>
                    <li>IVE: <strong>{ivaTexto}</strong></li>
                    <li>
                      Importe recibido: <strong>{importeRecibidoPorEntrada}</strong>
                      <span style={{ fontSize: "0.9rem", color: "#6c757d", marginLeft: "0.75rem" }}>
                        &rarr; {formulaRecibe}
                      </span>
                    </li>
                    <li>
                      Prezo venta: <strong>{prezoVentaTexto}</strong>
                      <span style={{ fontSize: "0.9rem", color: "#6c757d", marginLeft: "0.75rem" }}>&rarr; {formulaVenta}</span>
                    </li>
                  </>
                )}
                {!isGratis && isManualGestion && (
                  <li>
                    Prezo venta: <strong>{prezoVentaTexto}</strong>
                  </li>
                )}
                {isGratis && (
                  <li>
                    <strong style={{ color: '#28a745' }}>Evento Gratuíto</strong>
                  </li>
                )}
                <li>Número de entradas á venda: <strong>{evento.entradas ?? "[por cubrir]"}</strong></li>
              </ul>

              <h5>2. ROL DA PLATAFORMA</h5>
              A Plataforma actúa unicamente como intermediario tecnolóxico, proporcionando:
              <ul>
                <li>Publicación do evento na web (brasinda.com)</li>
                <li>Sistema de venda ou reserva de entradas</li>
                <li>Liquidación dos pagos ao organizador, descontando os gastos de xestión acordados</li>
                <li>Xestión dos reembolsos, no caso de que o organizador así o solicite</li>
              </ul>
              <strong>A Plataforma non é organizadora nin a promotora do evento.</strong>

              <div style={{marginTop: '2.5rem'}} />
              <h5>3. RESPONSABILIDADE DO ORGANIZADOR</h5>
              O Organizador é o único responsable da:
              <ul>
                <li>Legalidade do evento e permisos necesarios</li>
                <li>No caso de tratarse de eventos con contido musical, audiovisual ou artístico, cumprir coas obrigas de propiedade intelectual que apliquen</li>
                <li>Seguridade, licenzas, seguros e cumprimento normativo</li>
                <li>Execución e realización do evento</li>
                <li>Contido, artistas ou actividades do evento</li>
                <li>Atención ao público e reclamacións</li>
              </ul>

              <h5>4. PAGOS E LIQUIDACIÓN</h5>
              No caso de que os pagos se realicen a través da páxina web, os ingresos pola venda de entradas serán:
              <ul>
                <li>Recollidos a través do noso proveedor financiero Stripe, págandose a reserva coas tarxetas Euro 600, Visa, Mastercard ou Bizum</li>
                <li>Transferidos ao Organizador descontando as comisións acordadas</li>
                <li>No prazo de 4 días contados a partir das 23:59 horas do día no que finaliza o evento, o Organizador poderá realizar a liquidación do evento a través do noso proveedor financeiro (Stripe).</li>
              </ul>

              <h5>5. CANCELACIÓNS E DEVOLUCIÓNS</h5>
              <ul>
                <li>No caso de cancelación ou calquera tipo de cambio (data, local, artistas...), aplazamento ou descrición significativamente distinta ao evento real, o Organizador será responsable de informar á plataforma.</li>
                <li>No caso de cancelación, aplazamento ou descrición significativamente distinta ao evento real, o importe da entrada será reembolsado ao comprador utilizando o mesmo método de pago utilizado para a compra sempre que a plataforma o considere necesario. Este punto aplica a aqueles eventos cuxo importe da entrada se xestione a través da páxina web.</li>
                <li>No caso de cancelación, aplazamento ou descrición significativamente distinta ao evento real, o proceso de reembolso será xestionado polo Organizador. Este punto aplica aos eventos cuxo importe da entrada se xestione directamente co organizador.</li>
                <li>Para as reservas cuxo importe da venta se xestiona a través da páxina web, devolverase o importe íntegro da entrada ao comprador</li>
                <li>Para todas as disputas relacionadas con reembolsos, a Plataforma terá o dereito de realizar reembolsos en nome do Organizador e sen necesidad da súa autorización.</li>
                <li>A Plataforma podrá esixir ao Organizador que sexa o principal punto de contacto dos consumidores.</li>
                <li>En caso de cancelacións cuxo importe da entrada se xestione a través da web, o Organizador asumirá os gastos de xestión.</li>
              </ul>

              <div style={{marginTop: '2.5rem'}} />
              <h5>6. PROTECCIÓN E INDEMNIZACIÓN</h5>
              O Organizador comprométese a manter indemne á Plataforma fronte a:
              <ul>
                <li>Reclamacións de asistentes ou terceiros</li>
                <li>Sancións administrativas derivadas do evento</li>
                <li>Danos ou incidentes durante o evento</li>
                <li>Incumprimentos legais do Organizador</li>
              </ul>

              <div style={{marginTop: '2.5rem'}} />
              <h5>7. DATOS E VERACIDADE</h5>
              O Organizador declara que toda a información proporcionada é veraz e que dispón de autorizacións, seguros e permisos necesarios.

              <div style={{marginTop: '2.5rem'}} />
              <h5>8. PROPIEDADE E USO DA PLATAFORMA</h5>
                A Plataforma mantén todos os dereitos sobre o software e sistema de venda e reserva de entradas.
                A Plataforma non responderá por incidencias que poidan repercutir negativamente na venda de entradas e que sexan debidas a causas alleas tales como caídas de servidores de Internet ou calquera outra causa de forza maior.
              
              
              <div style={{marginTop: '2.5rem'}} />
              <h5>9. PROTECCIÓN DE DATOS</h5>
              <p>
                De conformidade co Regulamento (UE) 2016/679, relativo ao tratamento dos datos persoais (RGPD), ambas as Partes quedan informadas de maneira inequívoca e precisa de que os datos de carácter persoal que se faciliten no presente Contrato, 
                así como calquera outro dato que sexa facilitado ao longo da relación establecida no mesmo, serán tratados con total confidencialidade e estarán destinados á xestión e ao adecuado cumprimento do presente Contrato.
              </p>
              <p>
                Se, por necesidades relacionadas coa celebración do EVENTO, fose necesario facilitar ao ORGANIZADOR datos persoais dos compradores ou asistentes, 
                o ORGANIZADOR será debidamente identificado e informarase aos interesados sobre a finalidade para a que serán utilizados os seus datos.
              </p>
              <p>
                Unha vez realizada a cesión, o ORGANIZADOR será considerado Responsable do Tratamento para todos os efectos, comprometéndose a cumprir coa normativa aplicable en materia de protección de datos persoais e eximindo a plataforma de calquera responsabilidade 
                derivada dos tratamentos realizados á marxe dos orixinados no marco do presente Contrato.
              </p>

              <div style={{marginTop: '2.5rem'}} />
              <h5>10. DURACIÓN</h5>
              Este contrato é válido exclusivamente para o evento indicado e remata tras a súa finalización e liquidación.

              <div style={{marginTop: '2.5rem'}} />
              <h5>11. LEI APLICABLE</h5>
              Este contrato rexerase pola lexislación española.
            </div>

          <Form>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="lin-acepto"
                label={
                  <strong>
                    Lin e acepto o contrato de colaboración
                  </strong>
                }
                checked={aceptacionCondiciones}
                onChange={(e) =>
                  setAceptacionCondiciones(e.target.checked)
                }
              />
            </Form.Group>

            {aceptacionCondiciones && (
              <>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label><strong><FaUser style={{ marginRight: 6, color: "#ff0093" }} />Nome</strong></Form.Label>
                      <Form.Control
                        type="text"
                        value={nomeOrganizador}
                        onChange={e => setNomeOrganizador(e.target.value)}
                        onBlur={() => setTouched(t => ({ ...t, nomeOrganizador: true }))}
                        placeholder="Introduce o teu nome"
                      />
                      {touched.nomeOrganizador && nomeOrganizador.trim() === "" && (
                        <div className="text-danger small">Este campo é obrigatorio</div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label><strong>Apelidos</strong></Form.Label>
                      <Form.Control
                        type="text"
                        value={apelidosOrganizador}
                        onChange={e => setApelidosOrganizador(e.target.value)}
                        onBlur={() => setTouched(t => ({ ...t, apelidosOrganizador: true }))}
                        placeholder="Introduce os teus apelidos"
                      />
                      {touched.apelidosOrganizador && apelidosOrganizador.trim() === "" && (
                        <div className="text-danger small">Este campo é obrigatorio</div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label><strong><FaTag style={{ marginRight: 6, color: "#ff0093" }} />Tipo de organizador</strong></Form.Label>
                  <Form.Select
                    value={tipoOrganizador}
                    onChange={e => setTipoOrganizador(e.target.value)}
                    onBlur={() => setTouched(t => ({ ...t, tipoOrganizador: true }))}
                  >
                    <option value="">Selecciona un tipo</option>
                    <option value="Particular">Particular</option>
                    <option value="Autónomo">Autónomo</option>
                    <option value="Empresa">Empresa</option>
                    <option value="Asociación">Asociación</option>
                  </Form.Select>
                  {touched.tipoOrganizador && tipoOrganizador.trim() === "" && (
                    <div className="text-danger small">Este campo é obrigatorio</div>
                  )}
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label><strong><FaBriefcase style={{ marginRight: 6, color: "#ff0093" }} />Nome da organización</strong></Form.Label>
                  <Form.Control
                    type="text"
                    value={nomeEmpresa}
                    onChange={e => setNomeEmpresa(e.target.value)}
                    onBlur={() => setTouched(t => ({ ...t, nomeEmpresa: true }))}
                    placeholder="Introduce o nome da túa organización"
                  />
                  {touched.nomeEmpresa && nomeEmpresa.trim() === "" && (
                    <div className="text-danger small">Este campo é obrigatorio</div>
                  )}
                </Form.Group>
                <Form.Group className="mb-3">
                  <FaIdCard style={{ marginRight: "6px", color: "#ff0093" }} />
                  <Form.Label><strong>NIF</strong></Form.Label>
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
                  nomeOrganizador.trim() === "" ||
                  apelidosOrganizador.trim() === "" ||
                  tipoOrganizador.trim() === "" ||
                  nomeEmpresa.trim() === "" ||
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
