import { Button, Container, Form, Card, InputGroup } from "react-bootstrap";
import { useNavigate, useOutletContext } from "react-router-dom";
import React, { useState, useEffect } from "react";
import type { OutletContext } from "./0ElementoPadre";
import { FaArrowLeft } from "react-icons/fa";
import { ZONAS_AUDITORIOS } from "../planoAuditorios/ZonasAuditorios";

const PrezoContaBancaria: React.FC = () => {
  const [mostrarZonas, setMostrarZonas] = React.useState(false);
  const { evento, setEvento } = useOutletContext<OutletContext>();
  const [prezo, setPrezo] = useState<string>("");
  // Estados dinámicos para prezos por zona
  const [usarPrezoporZona, setUsarPrezoporZona] = useState(false);
  const [prezosZona, setPrezosZona] = useState<{ [zona: string]: string }>({});
  const [errorPrezoZona, setErrorPrezoZona] = useState("");
  const [errorPrezo, setErrorPrezo] = useState<string>("");
  const navigate = useNavigate();

  const [tipoEntrada, setTipoEntrada] = useState<"gratis" | "pago" | null>(null);
  // const [showManualPaymentModal, setShowManualPaymentModal] = useState<boolean>(false);
  // const [manualPaymentProcedure, setManualPaymentProcedure] = useState<string>("");
  const prezoNumericoVista = Number(prezo.replace(",", "."));
  const prezoValidoVista = prezo !== "" && !isNaN(prezoNumericoVista) && prezoNumericoVista > 0;
  // Novo cálculo: Prezo venta público = prezo + 5%
  const prezoVentaPublico = prezoValidoVista ? prezoNumericoVista * 1.05 : 0;
  const gastosXestion = prezoValidoVista ? prezoNumericoVista * 0.05 : 0;

  // 🔹 Inicializar cos valores gardados

  useEffect(() => {
    if (evento.precio) {
      const precioNum = Number(evento.precio.replace(",", "."));
      if (!isNaN(precioNum) && precioNum > 0) {
        setPrezo(precioNum.toFixed(2).replace(".", ","));
      } else {
        setPrezo("");
      }
    } else {
      setPrezo("");
    }
    // Detectar se é auditorio e activar prezos por zona automaticamente
    // Normalizar lugarEvento quitando acentos
    const normalize = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    const lugarEvento = normalize((evento.lugar || "").toLowerCase());
    const zonas = ZONAS_AUDITORIOS[lugarEvento] || [];
    if (zonas.length > 0) {
      setUsarPrezoporZona(true);
    } else {
      setUsarPrezoporZona(false);
    }
    if (evento.precios_zona && zonas.length > 0) {
      // Construír o estado para os inputs: { 'ZonaCentral': valor, ... }
      const prezos: { [zona: string]: string } = {};
      zonas.forEach(zona => {
        let key = zona.replace(/^zona/i, "").toLowerCase();
        if (key === "anfiteatro") key = "anfiteatro";
        prezos[zona] = evento.precios_zona?.[key] || "";
      });
      setPrezosZona(prezos);
    } else if (evento.precios_zona) {
      setPrezosZona({ ...evento.precios_zona });
    } else {
      setPrezosZona({});
    }
  }, [evento]);


  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let hasError = false;
    if (usarPrezoporZona) {
      // Detectar auditorio seleccionado
      const lugarEvento = (evento.lugar || "").toLowerCase();
      const zonas = ZONAS_AUDITORIOS[lugarEvento] || [];
      // Validar todos os prezos de zona
      for (let i = 0; i < zonas.length; i++) {
        const zona = zonas[i];
        const valor = Number((prezosZona[zona] || "").replace(",", "."));
        if (!prezosZona[zona] || isNaN(valor) || valor <= 0) {
          setErrorPrezoZona(`Por favor, introduce un prezo válido para a zona ${zona}`);
          hasError = true;
          break;
        }
      }
      if (!hasError) setErrorPrezoZona("");
      if (hasError) return;
      // Gardar prezos de zona no evento
      setEvento({
        ...evento,
        precios_zona: zonas.reduce((acc, zona) => {
          // Normalizar: quitar 'Zona'/'zona' e pasar a minúsculas
          let key = zona.replace(/^zona/i, "").toLowerCase();
          if (key === "anfiteatro") key = "anfiteatro"; // keep as is
          acc[key] = Number((prezosZona[zona] || "").replace(",", ".")).toFixed(2).replace(".", ",");
          return acc;
        }, {} as { [zona: string]: string })
      });
      navigate("/crear-evento/condiciones-legales");
      return;
    }
    // Prezo único
    const precioNumerico = Number(prezo.replace(",", "."));
    if (!prezo || isNaN(precioNumerico) || precioNumerico <= 0) {
      setErrorPrezo("Por favor, introduce un prezo válido");
      hasError = true;
    } else {
      setErrorPrezo("");
    }
    if (hasError) return;
    setEvento({ ...evento, precio: precioNumerico.toFixed(2).replace(".", ",") });
    navigate("/crear-evento/condiciones-legales");
  };

  return (
  <Container className="py-5 d-flex justify-content-center">
    <Card className="shadow-sm" style={{ maxWidth: "500px", width: "100%" }}>
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
                  <Form.Label>Prezo da entrada (€)</Form.Label>
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
                        if (regex.test(value)) setPrezo(value);
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
                  {errorPrezo && (
                    <div className="text-danger mt-2">{errorPrezo}</div>
                  )}
                  {prezoValidoVista && evento.tipo_gestion_entrada === "pagina" && (
                    <div className="mt-2 text-secondary">
                      <div>
                        <ul>
                          <li>Prezo venta público: {prezoVentaPublico.toFixed(2).replace(".", ",")} €.</li>
                          <li>Gastos de xestión (5%): {gastosXestion.toFixed(2).replace(".", ",")} €.</li>
                        </ul>
                      </div>
                    </div>
                  )}
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
                  <Button
                    variant={mostrarZonas ? "secondary" : "outline-secondary"}
                    className="boton-avance"
                    onClick={() => {
                      setMostrarZonas((prev) => {
                        const novoEstado = !prev;
                        setUsarPrezoporZona(novoEstado);
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
                    Establecer distintos prezos por zona
                  </Button>
                );
              })()}
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
                          <Form.Label>Prezo {label} (€)</Form.Label>
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
                        </Form.Group>
                      );
                    })}
                    {errorPrezoZona && (
                      <div className="text-danger mt-2">{errorPrezoZona}</div>
                    )}
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


