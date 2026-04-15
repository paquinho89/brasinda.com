import { Button, Container, Form, Card, InputGroup } from "react-bootstrap";
import { useNavigate, useOutletContext } from "react-router-dom";
import React, { useState, useEffect } from "react";
import type { OutletContext } from "./0ElementoPadre";
import { FaArrowLeft } from "react-icons/fa";
import { ZONAS_AUDITORIOS } from "../planoAuditorios/ZonasAuditorios";
import { FaExclamationTriangle } from "react-icons/fa";

const PrezoContaBancaria: React.FC = () => {
  const [mostrarZonas, setMostrarZonas] = React.useState(false);
  const { evento, setEvento } = useOutletContext<OutletContext>();
  const [prezo, setPrezo] = useState<string>("");
  // Estados dinámicos para prezos por zona
  const [prezosZona, setPrezosZona] = useState<{ [zona: string]: string }>({});
  const [errorPrezoZona, setErrorPrezoZona] = useState("");
  const [errorPrezo, setErrorPrezo] = useState<string>("");
  const navigate = useNavigate();

  const prezoNumericoVista = Number(prezo.replace(",", "."));
  const prezoValidoVista = prezo !== "" && !isNaN(prezoNumericoVista) && prezoNumericoVista > 0;
  // Novo cálculo: Prezo venta público = prezo + 5%
  const prezoVentaPublico = prezoValidoVista ? prezoNumericoVista * 1.05 : 0;
  const gastosXestion = prezoValidoVista ? prezoNumericoVista * 0.05 : 0;

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
      if (todasZonasCubertas) {
        setEvento({
          ...evento,
          precio: '',
          precios_zona: prezosZonaGardar
        });
      } else {
        const precioNumerico = Number(prezo.replace(",", "."));
        setEvento({ ...evento, precio: precioNumerico.toFixed(2).replace(".", ","), precios_zona: prezosZonaGardar });
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
                  {/* Só mostrar erro se realmente se require o prezo xeral */}
                  {errorPrezo && (
                    <div className="alert alert-danger" style={{ background: "#ffe6f3", color: "#000", marginTop: 0, display: 'flex', alignItems: 'center' }}>
                        <FaExclamationTriangle style={{ color: '#ff0093', marginRight: 8 }} />
                        {errorPrezo}
                    </div>
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
                      <div className="alert alert-danger" style={{ background: "#ffe6f3", color: "#000", marginTop: 0, display: 'flex', alignItems: 'center' }}>
                        <FaExclamationTriangle style={{ color: '#ff0093', marginRight: 8 }} />
                        {errorPrezoZona}
                    </div>
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


