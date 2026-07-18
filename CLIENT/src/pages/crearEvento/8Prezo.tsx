import { Button, Container, Form, Card, InputGroup } from "react-bootstrap";
import { useNavigate, useOutletContext } from "react-router-dom";
import React, { useState, useEffect } from "react";
import type { OutletContext } from "./0ElementoPadre";
import { FaArrowLeft } from "react-icons/fa";
import { ZONAS_AUDITORIOS } from "../planoAuditorios/ZonasAuditorios";
import { FaExclamationTriangle } from "react-icons/fa";

const PrezoContaBancaria: React.FC = () => {
  // 5% gastos de xestión (usado nos cálculos inline)
  const [mostrarZonas, setMostrarZonas] = React.useState(false);
  const { evento, setEvento } = useOutletContext<OutletContext>();
  const [prezo, setPrezo] = useState<string>("");
  const [checkOrganizador, setCheckOrganizador] = useState<boolean>(evento.asumeFees ?? false);
  const [gastosDecisionMade, setGastosDecisionMade] = useState<boolean>(evento.asumeFees !== undefined);
  const [checkComprador] = useState<boolean>(false);
  const [iveRate, setIveRate] = useState<number | null>(null);
  // Estados dinámicos para prezos por zona
  const [prezosZona, setPrezosZona] = useState<{ [zona: string]: string }>({});
  const [errorPrezoZona, setErrorPrezoZona] = useState("");
  const [errorPrezo, setErrorPrezo] = useState<string>("");
  const navigate = useNavigate();
  const isGestionPagina = evento.tipo_gestion_entrada === "pagina";

  // Removed unused prezoNumericoVista
  // Novo cálculo: Prezo venta público = prezo + 5%
  // Removed unused prezoVentaPublico and gastosXestion

  // 🔹 Inicializar cos valores gardados

  useEffect(() => {
    // Primeiro, intentar cargar prezosZona do localStorage
    const prezosZonaLS = localStorage.getItem("prezosZona");
    let prezosZonaInicial: { [zona: string]: string } | null = null;
    if (prezosZonaLS) {
      try {
        prezosZonaInicial = JSON.parse(prezosZonaLS);
        if (prezosZonaInicial && typeof prezosZonaInicial === 'object' && !Array.isArray(prezosZonaInicial)) {
          setPrezosZona(prezosZonaInicial);
        }
      } catch {}
    }
    if (evento.prezo_base) {
      const precioNum = Number(evento.prezo_base.replace(",", "."));
      if (!isNaN(precioNum) && precioNum > 0) {
        setPrezo(precioNum.toFixed(2).replace(".", ","));
      } else {
        setPrezo("");
      }
    } else {
      setPrezo("");
    }
    // Detectar se é auditorio e activar prezos por zona automaticamente
    // Usar sempre a mesma función de normalización
    const normalizeAuditorio = (str: string) => (str || "").normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "").toLowerCase().trim();
    const zonasKeys = Object.keys(ZONAS_AUDITORIOS);
    const normalizedKeyMap = Object.fromEntries(zonasKeys.map(k => [normalizeAuditorio(k), k]));
    const lugarEventoNorm = normalizeAuditorio(evento.lugar);
    const audKey = normalizedKeyMap[lugarEventoNorm];
    const zonas = audKey ? ZONAS_AUDITORIOS[audKey] : [];
    // Sempre sincronizar prezosZona co evento, se existen prezos gardados, pero só se non se cargou de localStorage
    if (!prezosZonaLS) {
      if (evento.precios_zona && zonas.length > 0) {
        const prezos: { [zona: string]: string } = {};
        zonas.forEach(zona => {
          let key = zona.replace(/^zona/i, "").toLowerCase();
          if (key === "anfiteatro") key = "anfiteatro";
          prezos[zona] = evento.precios_zona?.[key] || "";
        });
        setPrezosZona(prezos);
      } else if (evento.precios_zona) {
        // Mapear as claves de prezos_zona ás zonas do auditorio se existen
        const prezos: { [zona: string]: string } = {};
        Object.entries(evento.precios_zona).forEach(([key, val]) => {
          // Buscar a zona correspondente
          const zona = zonas.find(z => z.replace(/^zona/i, "").toLowerCase() === key);
          if (zona) prezos[zona] = val;
        });
        setPrezosZona(prezos);
      } else {
        setPrezosZona({});
      }
    }
  }, [evento]);


  // Gardar prezosZona en localStorage cando cambie
  useEffect(() => {
    localStorage.setItem("prezosZona", JSON.stringify(prezosZona));
  }, [prezosZona]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();    // Detectar auditorio seleccionado
    const normalizeAuditorio = (str: string) => (str || "").normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "").toLowerCase().trim();
    const zonasKeys = Object.keys(ZONAS_AUDITORIOS);
    const normalizedKeyMap = Object.fromEntries(zonasKeys.map(k => [normalizeAuditorio(k), k]));
    const lugarEventoNorm = normalizeAuditorio(evento.lugar);
    const audKey = normalizedKeyMap[lugarEventoNorm];
    const zonasAuditorio = audKey ? ZONAS_AUDITORIOS[audKey] : [];
    // Se se mostran as zonas, usar as zonas do auditorio (inputs visibles)
    const zonas = mostrarZonas ? zonasAuditorio : [];
    // Comprobación: ou prezo xeral OU todos os prezos de zona deben estar completos
    let prezoXeralCuberto = prezo !== "" && !isNaN(Number(prezo.replace(",", "."))) && Number(prezo.replace(",", ".")) > 0;
    // Comprobar só as zonas visibles cando mostrarZonas é true, sen depender do texto das claves
    const todasZonasCubertas = mostrarZonas && zonas.length > 0 && zonas.every((_, idx) => {
      // O input visible é prezosZona[zonasAuditorio[idx]]
      const raw = prezosZona[zonasAuditorio[idx]];
      const valor = Number((raw || "").replace(",", "."));
      const valido = raw !== undefined && raw !== null && raw.trim() !== "" && !isNaN(valor) && valor > 0;
      return valido;
    });
    // DEBUG: imprimir valores en consola
    console.log('todasZonasCubertas:', todasZonasCubertas, 'prezoXeralCuberto:', prezoXeralCuberto, 'zonas:', zonas.length, 'mostrar Zonas:', mostrarZonas);

    // Permitir avanzar se todos os prezos das zonas están cubertos OU prezo xeral cuberto
    if (todasZonasCubertas || prezoXeralCuberto) {
      setErrorPrezo("");
      setErrorPrezoZona("");
      // Gardar sempre prezos_zona se hai algún valor cuberto
      let prezosZonaGardar: { [zona: string]: string } | undefined = undefined;
      if (zonas.length > 0 && Object.values(prezosZona).some(v => v && v.trim() !== "")) {
        prezosZonaGardar = zonas.reduce((acc, zona) => {
          let key = zona.replace(/^zona/i, "").toLowerCase();
          if (key === "anfiteatro") key = "anfiteatro";
          acc[key] = Number((prezosZona[zona] || "").replace(",", ".")).toFixed(2).replace(".", ",");
          return acc;
        }, {} as { [zona: string]: string });
      }
      const pvpCalculado = (() => {
        const base = Number(prezo.replace(",", "."));
        const ivaRate = iveRate ?? 0;
        if (!isNaN(base) && base > 0) {
          const ivaPrecio = base * ivaRate;
          const gastosBase = base * 0.05;
          const gastosIVE = gastosBase * 0.21; // IVE normal por defecto
          const gastos = checkOrganizador ? 0 : gastosBase + gastosIVE;
          return (base + ivaPrecio + gastos).toFixed(2).replace(".", ",");
        }
        return prezo;
      })();
      // O que realmente recibe o organizador = base + IVE por entrada - gastos que asume
      const recibeCalculado = (() => {
        const base = Number(prezo.replace(",", "."));
        const ivaRate = iveRate ?? 0;
        if (!isNaN(base) && base > 0) {
          const ivaPrecio = base * ivaRate;
          const gastosBase = base * 0.05;
          const gastosIVE = gastosBase * 0.21; // IVE normal por defecto
          const gastos = checkOrganizador ? gastosBase + gastosIVE : 0;
          return (base + ivaPrecio - gastos).toFixed(2).replace(".", ",");
        }
        return prezo;
      })();
      const gastosAsumeValor: "organizador" | "comprador" = checkComprador ? "comprador" : "organizador";
      if (todasZonasCubertas) {
        setEvento({
          ...evento,
          prezo_base: prezo,
          prezo_recibe_organizador: '',
          prezo_venta: pvpCalculado,
          precios_zona: prezosZonaGardar,
          gastosAsume: gastosAsumeValor,
          asumeFees: checkOrganizador,
        });
      } else {
        setEvento({ ...evento, 
                    prezo_base: prezo, 
                    prezo_recibe_organizador: recibeCalculado, 
                    precios_zona: prezosZonaGardar, 
                    gastosAsume: gastosAsumeValor, 
                    asumeFees: checkOrganizador, 
                    prezo_venta: pvpCalculado });
      }
      // Limpar prezosZona do localStorage ao avanzar
      localStorage.removeItem("prezosZona");
      navigate("/crear-evento/condiciones-legales");
      return;
    }
    // Se non se cumpre ningunha, mostrar erro
    setErrorPrezo("Falta o prezo");
    setErrorPrezoZona("Cubre o prezo en todas as zonas");
    return;
  };

  return (
  <Container className="py-5 d-flex justify-content-center">
    <Card className="shadow-sm" style={{ maxWidth: "700px", width: "100%" }}>
      <Card.Body className="p-4">
        <h3 className="text-center mb-4">Prezo da entrada</h3>
        {/* Botón para mostrar/ocultar zonas do auditorio para calquera auditorio con zonas */}
        {/* Eliminado: bloque de visualización de zonas do auditorio */}
        <Form onSubmit={handleSubmit}>
              {/* Opción de prezos por zona só se hai zonas */}
              {(() => {
                const lugarEvento = (evento.lugar || "").toLowerCase();
                const zonas = Array.isArray(ZONAS_AUDITORIOS[lugarEvento]) ? ZONAS_AUDITORIOS[lugarEvento] : [];
                if (zonas.length === 0) return null;
              })()}
              {/* Prezo da entrada xeral só visible se non se mostran as zonas */}
              {!mostrarZonas && (
                <Form.Group className="mb-3">
                  <InputGroup>
                    <InputGroup.Text>€</InputGroup.Text>
                    <Form.Control
                      type="text"
                      inputMode="decimal"
                      value={prezo}
                      placeholder="Prezo da entrada"
                      onChange={e => {
                        const value = e.target.value.replace(".", ",");
                        const regex = /^\d*(,\d{0,2})?$/;
                        if (regex.test(value)) {
                          setPrezo(value);
                          setGastosDecisionMade(false);
                        }
                      }}
                      onBlur={() => {
                        if (!prezo) return;
                        let [intPart, decPart] = prezo.split(",");
                        if (!decPart) decPart = "00";
                        else if (decPart.length === 1) decPart += "0";
                        else if (decPart.length > 2) decPart = decPart.slice(0, 2);
                        setPrezo(`${intPart},${decPart}`);
                      }}
                    />
                  </InputGroup>
                  {/* Só mostrar erro se realmente se require o prezo xeral */}
                  {errorPrezo && (
                    <div className="alert alert-danger" style={{ background: "#ffe6f3", color: "#000", marginTop: 0, display: 'flex', alignItems: 'center' }}>
                        <FaExclamationTriangle style={{ color: '#ff0093', marginRight: 8 }} />
                        {errorPrezo}
                    </div>
                  )}
                </Form.Group>
              )}
              {/* Checkboxes de gastos de xestión */}
              {!mostrarZonas && isGestionPagina && prezo !== "" && Number(prezo.replace(",", ".")) > 0 && (
                <Form.Group className="mb-3">
                  {(() => {
                    const base = Number(prezo.replace(",", "."));
                    const gastosBase = base * 0.05;
                    const gastosIVE = gastosBase * 0.21; // IVE de gastos de xestión sempre 21%
                    const gastosTotais = gastosBase + gastosIVE; // prezo*0.05 + prezo*0.05*0.21
                    const fmtGastos = (!isNaN(base) && base > 0)
                      ? gastosTotais.toLocaleString("gl-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : null;
                   
                    return (
                      <>
                        <div style={{ marginBottom: 12 }}>
                          <h5 style={{ marginBottom: 10 }}>Gastos de Xestión</h5>
                          <div style={{ fontSize: "1rem", marginBottom: 10 }}>
                            {fmtGastos
                              ? <>
                                  <div>Queres aplicar os gastos de xestión ao prezo final de venta?</div>
                                  <div style={{ color: "#666", fontSize: "0.85em" }}>{gastosBase.toLocaleString("gl-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€ (5%) + {gastosIVE.toLocaleString("gl-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€ (IVE da xestión 21%) = <strong>{fmtGastos} €</strong></div>
                                </>
                              : `O organizador asume os gastos de xestión (5%) + IVE (${iveRate !== null ? Math.round(iveRate * 100) : 0}%)`
                            }
                          </div>
                          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", paddingBottom: "15px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setCheckOrganizador(false);
                                  setGastosDecisionMade(true);
                                }}
                                style={{
                                  border: "none",
                                  background: "transparent",
                                  color: !checkOrganizador ? "#ff0093" : "#8e24aa",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                SI
                              </button>
                              <label style={{ position: "relative", display: "inline-block", width: 60, height: 32, background: !checkOrganizador ? "#ff0093" : "#ccc", borderRadius: 999, cursor: "pointer" }}>
                                <input
                                  type="checkbox"
                                  checked={!checkOrganizador}
                                  onChange={e => {
                                    setCheckOrganizador(!e.target.checked);
                                    setGastosDecisionMade(true);
                                  }}
                                  style={{ display: "none" }}
                                />
                                <span style={{
                                  position: "absolute",
                                  top: 2,
                                  left: !checkOrganizador ? 2 : 30,
                                  width: 28,
                                  height: 28,
                                  background: "#fff",
                                  borderRadius: "50%",
                                  transition: "left 0.2s ease",
                                }} />
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setCheckOrganizador(true);
                                  setGastosDecisionMade(true);
                                }}
                                style={{
                                  border: "none",
                                  background: "transparent",
                                  color: checkOrganizador ? "#ff0093" : "#222222",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                NON
                              </button>
                            </div>
                          </div>
                        </div>
                        {gastosDecisionMade && (
                          <div className="mt-3" style={{ paddingTop: 14, borderTop: "1px solid #dee2e6" }}>
                            <h5 style={{ marginBottom: 10 }}>IVE</h5>
                            <Form.Check
                            type="radio"
                            id="sen-ive"
                            name="ive-rate"
                            label="Non quero aplicar o IVE (0%)"
                            checked={iveRate === 0}
                            onChange={() => setIveRate(0)}
                            className="mb-2"
                          />
                          <Form.Check
                            type="radio"
                            id="ive-reducido"
                            name="ive-rate"
                            label="IVE reducido (10%)"
                            checked={iveRate === 0.10}
                            onChange={() => setIveRate(0.10)}
                            className="mb-2"
                          />
                          <Form.Check
                            type="radio"
                            id="ive-normal"
                            name="ive-rate"
                            label="IVE normal (21%)"
                            checked={iveRate === 0.21}
                            onChange={() => setIveRate(0.21)}
                          />
                          <div style={{ marginTop: 10, fontSize: "0.95rem", color: "#333" }}>
                            IVE por entrada = {prezo && !isNaN(Number(prezo.replace(",", "."))) ? (Number(prezo.replace(",", ".")) * (iveRate ?? 0)).toFixed(2).replace(".", ",") : "0,00"} €
                          </div>
                        </div>
                        )}
                        {iveRate !== null && !isNaN(base) && base > 0 && (() => {
                          const ivaPrecio = base * iveRate;
                          const ivaTexto = ivaPrecio > 0
                            ? ` + ${ivaPrecio.toLocaleString("gl-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € (IVE da entrada ${Math.round(iveRate * 100)}%)`
                            : "";
                          const pvpTotal = base
                            + ivaPrecio
                            + (checkOrganizador ? 0 : gastosTotais)
                          // Recibes = base + IVE por entrada - o que SI asume o organizador
                          const recibeTotal = base
                            + ivaPrecio
                            - (checkOrganizador ? gastosTotais : 0)
                          const fmtPvpTotal = pvpTotal.toLocaleString("gl-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          const fmtRecibe = recibeTotal.toLocaleString("gl-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          return (
                            <div style={{ marginTop: 18, borderTop: "2px solid #dee2e6", paddingTop: 14 }}>
                              <div style={{ display: "flex", flexDirection: "column", background: "#f1e4f7", borderRadius: 8, padding: "10px 14px", marginBottom: 8 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                                  <span style={{ fontSize: "1em" }}><strong>Recibes por entrada</strong></span>
                                  <strong style={{ fontSize: "1.25em", color: "black" }}>{fmtRecibe} €</strong>
                                </div>
                                <div style={{ marginTop: 6, fontSize: "0.95em", color: "#555" }}>
                                  {prezo} €{ivaTexto}
                                  {checkOrganizador && <> - {fmtGastos} € (Xestión)</>}
                                  = {fmtRecibe}€
                                </div>
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", background: "#fff0f8", borderRadius: 8, padding: "10px 14px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={{ fontSize: "1em" }}><strong>Prezo Venta</strong></span>
                                  <strong style={{ fontSize: "1.25em", color: "black" }}>{fmtPvpTotal} €</strong>
                                </div>
                                <div style={{ marginTop: 6, fontSize: "0.95em", color: "#555" }}>
                                  {prezo} €{ivaTexto}
                                  {checkOrganizador ? ` = ${fmtPvpTotal}€` : <> + {fmtGastos} € (Xestión) = {fmtPvpTotal}€</>}
                                </div>
                              </div>
                            </div>
                            
                          );
                        })()}
                      </>
                    );
                  })()}
                </Form.Group>
              )}
              {(() => {
                // Normalizar para comparar ignorando maiúsculas/minúsculas e acentos
                const normalize = (str: string) => (str || "").normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
                const lugarNorm = normalize(evento.lugar);
                const audVerin = normalize("Auditorio de Verín");
                const audOurense = normalize("Auditorio de Ourense");
                const audSantiago = normalize("Auditorio de Santiago");
                if (![audVerin, audOurense, audSantiago].includes(lugarNorm)) return null;
                return (
                  
                  <div style={{ paddingTop: 14, display: "flex", justifyContent: "center" }}>
                  <Button
                    variant={mostrarZonas ? "secondary" : "outline-secondary"}
                    className="boton-avance mt-3"
                    onClick={() => {
                      setMostrarZonas((prev) => {
                        const novoEstado = !prev;
                        // Inicializar prezosZona se está baleiro e se vai mostrar
                        if (novoEstado && Object.keys(prezosZona).length === 0) {
                          setPrezosZona({
                            "Zona Central": "",
                            "Zona Dereita": "",
                            "Zona Esquerda": "",
                            "Anfiteatro": ""
                          });
                        }
                        return novoEstado;
                      });
                    }}
                  >
                    {mostrarZonas ? "Cerrar" : "Quero establecer distintos prezos por zona"}
                  </Button>
                  </div>
                );
              })()}
              {mostrarZonas && isGestionPagina && (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <h5 style={{ marginBottom: 10 }}>Gastos de Xestión</h5>
                    <div style={{ fontSize: "1rem", marginBottom: 10 }}>
                      Queres aplicar os gastos de xestión ao prezo final de venta?
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", paddingBottom: "15px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <button
                          type="button"
                          onClick={() => {
                            setCheckOrganizador(false);
                            setGastosDecisionMade(true);
                          }}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: !checkOrganizador ? "#ff0093" : "#222222",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          SI
                        </button>
                        <label style={{ position: "relative", display: "inline-block", width: 60, height: 32, background: !checkOrganizador ? "#ff0093" : "#ccc", borderRadius: 999, cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={!checkOrganizador}
                            onChange={e => {
                              setCheckOrganizador(!e.target.checked);
                              setGastosDecisionMade(true);
                            }}
                            style={{ display: "none" }}
                          />
                          <span style={{
                            position: "absolute",
                            top: 2,
                            left: !checkOrganizador ? 2 : 30,
                            width: 28,
                            height: 28,
                            background: "#fff",
                            borderRadius: "50%",
                            transition: "left 0.2s ease",
                          }} />
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setCheckOrganizador(true);
                            setGastosDecisionMade(true);
                          }}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: checkOrganizador ? "#ff0093" : "#222222",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          NON
                        </button>
                      </div>
                    </div>
                  </div>
                  {gastosDecisionMade && (
                    <div className="mt-4" style={{ marginTop: 24, paddingTop: 14, paddingBottom: 18, marginBottom: 24, borderTop: "1px solid #dee2e6", borderBottom: "1px solid #dee2e6" }}>
                      <h5 style={{ marginBottom: 10 }}>IVE</h5>
                      <Form.Check
                      type="radio"
                      id="sen-ive-zona-superior"
                      name="ive-rate-zona"
                      label="Non quero aplicar o IVE (0%)"
                      checked={iveRate === 0}
                      onChange={() => setIveRate(0)}
                      className="mb-2"
                    />
                    <Form.Check
                      type="radio"
                      id="ive-reducido-zona-superior"
                      name="ive-rate-zona"
                      label="IVE reducido (10%)"
                      checked={iveRate === 0.10}
                      onChange={() => setIveRate(0.10)}
                      className="mb-2"
                    />
                    <Form.Check
                      type="radio"
                      id="ive-normal-zona-superior"
                      name="ive-rate-zona"
                      label="IVE normal (21%)"
                      checked={iveRate === 0.21}
                      onChange={() => setIveRate(0.21)}
                    />
                  </div>
                )}
                  {errorPrezoZona && (
                    <div className="alert alert-danger" style={{ background: "#ffe6f3", color: "#000", marginTop: 0, display: 'flex', alignItems: 'center' }}>
                      <FaExclamationTriangle style={{ color: '#ff0093', marginRight: 8 }} />
                      {errorPrezoZona}
                    </div>
                  )}
                </>
              )}
              {/* Inputs dinámicos para prezos por zona, só se está activado */}
              {mostrarZonas && (() => {
                // Normalizar o nome do auditorio igual que no resto do ficheiro
                const normalize = (str: string) => (str || "").normalize('NFD').replace(/[ -\u036f]/g, '').toLowerCase().trim();
                const lugarEventoNorm = normalize(evento.lugar);
                const zonasKeys = Object.keys(ZONAS_AUDITORIOS);
                const normalizedKeyMap = Object.fromEntries(zonasKeys.map(k => [normalize(k), k]));
                const audKey = normalizedKeyMap[lugarEventoNorm];
                const zonas = audKey ? ZONAS_AUDITORIOS[audKey] : [];
                return (
                  <>
                    {zonas.map((zona) => {
                      let label = zona.replace(/^Zona ?/i, "");
                      return (
                        <Form.Group className="mb-3" key={zona}>
                          <Form.Label>Prezo {label}</Form.Label>
                          <InputGroup>
                            <InputGroup.Text>€</InputGroup.Text>
                            <Form.Control
                              type="text"
                              inputMode="decimal"
                              value={prezosZona[zona] || ""}
                              placeholder={`0`}
                              onChange={e => {
                                const value = e.target.value.replace(".", ",");
                                const regex = /^\d*(,\d{0,2})?$/;
                                if (regex.test(value)) setPrezosZona(prev => ({ ...prev, [zona]: value }));
                              }}
                              onBlur={() => {
                                const val = prezosZona[zona];
                                if (!val) return;
                                let [intPart, decPart] = val.split(",");
                                if (!decPart) decPart = "00";
                                else if (decPart.length === 1) decPart += "0";
                                else if (decPart.length > 2) decPart = decPart.slice(0, 2);
                                setPrezosZona(prev => ({ ...prev, [zona]: `${intPart},${decPart}` }));
                              }}
                            />
                          </InputGroup>
                          {(() => {
                            const baseZona = Number((prezosZona[zona] || "").replace(",", "."));
                            if (!isGestionPagina || iveRate === null || isNaN(baseZona) || baseZona <= 0) return null;
                            const gastosBaseZ = baseZona * 0.05;
                            const gastosIVEZ = gastosBaseZ * 0.21;
                            const gastosTotaisZ = gastosBaseZ + gastosIVEZ;
                            const ivaPrecioZ = baseZona * (iveRate ?? 0);
                            const ivaTextoZ = ivaPrecioZ > 0 ? ` + ${ivaPrecioZ.toLocaleString("gl-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € (IVE ${Math.round(iveRate * 100)}%)` : "";
                            const pvpZ = baseZona + ivaPrecioZ + (checkOrganizador ? 0 : gastosTotaisZ);
                            const recibeZ = baseZona + ivaPrecioZ - (checkOrganizador ? gastosTotaisZ : 0);
                            const fmt = (n: number) => n.toLocaleString("gl-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            return (
                              <div style={{ marginTop: 8, background: "#fff0f8", borderRadius: 8, padding: "10px 14px", fontSize: "0.9em" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                  <span style={{ color: "#555" }}>• Gastos xestión:</span>
                                  <span><strong style={{ color: "#8e24aa" }}>{fmt(gastosTotaisZ)} €</strong> </span>
                                </div>
                                <div style={{ marginTop: 0.5, marginBottom: 8, fontSize: "0.85em", color: "#555" }}>
                                  {fmt(gastosBaseZ)}€ (5%) + {fmt(gastosIVEZ)}€ (21% IVE)
                                </div>
                                
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                  <span style={{ color: "#555", fontSize: "0.85rem" }}>
                                    • Recibes por entrada:
                                  </span>
                                  <strong style={{ color: "#8e24aa" }}>{fmt(recibeZ)} €</strong>
                                </div>
                                <div style={{ marginTop: 0.5, marginBottom: 8, fontSize: "0.85em", color: "#555" }}>
                                  {baseZona} €{ivaTextoZ}
                                  {checkOrganizador ? ` - ${fmt(gastosTotaisZ)} € (Xestión)` : ""}
                                </div>
                                
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <span style={{ color: "#555" }}>• Prezo Venta:</span>
                                  <strong style={{ color: "black" }}>{fmt(pvpZ)} €</strong>
                                </div>
                                <div style={{ marginTop: 1, marginBottom: 8, fontSize: "0.85em", color: "#555" }}>
                                  {baseZona} €{ivaTextoZ}
                                  {checkOrganizador ? "" : ` + ${fmt(gastosTotaisZ)} € (Xestión)`} = {fmt(pvpZ)}€
                                </div>
                              </div>
                            );
                          })()}
                        </Form.Group>
                      );
                    })}
                  </>
                );
              })()}
              {/* BOTÓNS */}
              <div className="d-flex justify-content-between mt-4">
                <Button
                  className="boton-avance"
                  onClick={() => navigate(-1)}
                >
                  <FaArrowLeft className="me-2" />
                  Volver
                </Button>
                <Button
                  className="boton-avance"
                  type="submit"
                >
                  Continuar
                </Button>
              </div>
            </Form>
        {/* ...existing code... */}
      </Card.Body>
    </Card>
  </Container>
  );
}

export default PrezoContaBancaria;


