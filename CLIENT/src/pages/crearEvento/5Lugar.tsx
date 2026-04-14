import React, { useEffect, useRef, useState } from "react";
import { Button, Container, Card, Form } from "react-bootstrap";
import { useNavigate, useOutletContext } from "react-router-dom";
import type { OutletContext } from "./0ElementoPadre";
import { GeocoderAutocomplete } from "@geoapify/geocoder-autocomplete";
import { FaArrowLeft } from "react-icons/fa";
import "@geoapify/geocoder-autocomplete/styles/minimal.css";
import "../../estilos/Botones.css";

const LugarPaso: React.FC = () => {
  const PLACE_TYPES = [
    "Auditorio",
    "Bar/Restaurante",
    "Calle",
    "Estadio",
    "Local privado",
    "Plaza pública",
    "Polideportivo",
    "Sala de conciertos",
    "Teatro",
    "Otros",
  ];

  const { evento, setEvento } = useOutletContext<OutletContext>();
  const [selectedPlace, setSelectedPlace] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [showNotaLugar, setShowNotaLugar] = useState(false);
  const [notaLugar, setNotaLugar] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const navigate = useNavigate();

  // O autocomplete debe ter valor para poder avanzar
  const formularioIncompleto = !evento?.lugar?.trim() || !selectedPlace;
  useEffect(() => {
    console.log("🔍 Debug:", {
      selectedPlace,
      lugarEvento: evento?.lugar,
      inputValue,
      formularioIncompleto,
    });
  }, [selectedPlace, evento?.lugar, inputValue, formularioIncompleto]);

  /* ================================
     SINCRONIZACIÓN CON CONTEXTO
  ================================== */

  useEffect(() => {
    if (evento) {
      if (evento.lugar && !inputValue) {
        setInputValue(evento.lugar);
      }
      if (evento.ubicacion && !selectedPlace)
        setSelectedPlace(evento.ubicacion);
    }
  }, [evento]);

  useEffect(() => {
    const input = containerRef.current?.querySelector("input") as HTMLInputElement | null;
    if (!input) return;
    if (evento?.lugar) {
      input.value = evento.lugar;
    }
  }, [evento]);

  /* ================================
     SUBMIT
  ================================== */

  const handleSubmit = () => {
    // Usar directamente inputValue y selectedPlace
    if (!selectedPlace) {
      alert("Por favor, selecciona o tipo de lugar");
      return;
    }
    if (!inputValue.trim()) {
      alert("Por favor, selecciona o lugar onde vas a realizar o evento");
      return;
    }
    setEvento({
      ...evento,
      lugar: inputValue.trim(),
      ubicacion: selectedPlace,
      localidade: evento?.localidade || "",
      coordenadas: evento?.coordenadas,
      nota_lugar: notaLugar,
    });
    navigate("/crear-evento/entradas");
  };

  /* ================================
     INICIALIZAR AUTOCOMPLETE
  ================================== */

  useEffect(() => {
    if (!containerRef.current || initialized.current) return;
    initialized.current = true;

    const autocomplete = new GeocoderAutocomplete(
      containerRef.current,
      import.meta.env.VITE_GEOAPIFY_AUTOCOMPLETE_APP_API_KEY!,
      {
        placeholder:
          "Buscar o lugar onde vai ter lugar o evento...",
        limit: 5,
        lang: "es",
        filterByCountryCode: ["es"],
        types: ["city", "town", "village", "amenity"],
      } as any
    );

    autocomplete.on("select", (feature: any) => {
      console.log("🎯 Feature completa:", feature);
      console.log("🎯 Properties:", feature.properties);
      console.log("🔎 Todos os campos properties:", Object.keys(feature.properties));
      console.log("🔎 Valores de properties:", feature.properties);

      const nomeLugar = feature.properties.name || feature.properties.formatted || "";
      const localidade = feature.properties.municipality || feature.properties.city || feature.properties.town || feature.properties.village || feature.properties.county || feature.properties.state_district || "";

      // Preferir geometry.coordinates, pero se non existe, usar properties.lat/lon
      let coordenadas: number[] | undefined = undefined;
      if (feature.geometry && Array.isArray(feature.geometry.coordinates) && feature.geometry.coordinates.length === 2) {
        // GeoJSON: [lon, lat] → [lat, lon]
        coordenadas = [Number(feature.geometry.coordinates[1]), Number(feature.geometry.coordinates[0])];
      } else if (feature.properties.lat && feature.properties.lon) {
        coordenadas = [parseFloat(feature.properties.lat), parseFloat(feature.properties.lon)];
      }
      console.log("✅ Coordenadas extraídas:", coordenadas);

      setInputValue(nomeLugar);

      setEvento((prev) => ({
        ...prev,
        lugar: nomeLugar,
        localidade: localidade,
        coordenadas: coordenadas,
        nota_lugar: notaLugar,
      }));
    });

    // Escuchar cambios en el input
    const input = containerRef.current?.querySelector("input") as HTMLInputElement | null;
    if (input) {
      const handleInput = () => {
        console.log("📝 Input changed:", input.value);
        setInputValue(input.value);
      };
      input.addEventListener("input", handleInput);
      
      return () => {
        input.removeEventListener("input", handleInput);
      };
    }
  }, []);

  /* ================================
     RENDER
  ================================== */

  return (
    <Container className="py-5 d-flex justify-content-center">
      <Card
        className="shadow-sm"
        style={{
          maxWidth: "600px",
          width: "100%",
          overflow: "visible", // 🔥 CLAVE
        }}
      >
        <Card.Body className="p-4">
          <h3 className="text-center mb-4">
            Lugar do evento
          </h3>

          {/* SELECT TIPO LUGAR */}
          <div className="mb-3">
            <label
              htmlFor="place-select"
              className="form-label"
            >
              Tipo de lugar
            </label>

            <select
              id="place-select"
              className="form-select"
              value={selectedPlace}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedPlace(val);
                setEvento((prev) => ({
                  ...prev,
                  ubicacion: val,
                }));
              }}
            >
              <option value="">
                Selecciona unha opción
              </option>

              {PLACE_TYPES.map((place) => (
                <option key={place} value={place}>
                  {place}
                </option>
              ))}
            </select>
          </div>

          {/* AUTOCOMPLETE + NOTA */}
          <div className="mb-4">
            <label className="form-label">Buscar lugar</label>
            <div
              ref={containerRef}
              style={{ width: "100%", position: "relative", zIndex: 1000 }}
            />
            <div className="mt-2 d-flex justify-content-center">
              <button
                className="boton-avance"
                style={{ width: "auto", minWidth: 0, padding: "8px 18px", marginBottom: 0 }}
                onClick={() => setShowNotaLugar((v) => !v)}
                type="button"
              >
                Engadir información sobre o lugar
              </button>
            </div>
            {showNotaLugar && (
              <>
                <Form.Control
                  className="mt-3"
                  type="text"
                  placeholder="Max 50 caracteres"
                  maxLength={50}
                  value={notaLugar}
                  onChange={e => {
                    if (e.target.value.length <= 50) setNotaLugar(e.target.value);
                  }}
                />
                <div className="text-end text-muted" style={{ fontSize: "0.92rem" }}>
                  {notaLugar.length}/50
                </div>
              </>
            )}
          </div>

          <div className="mb-3 mt-4 d-flex justify-content-between align-items-center">
            <Button
              className="boton-avance"
              onClick={() => navigate(-1)}
            >
              <FaArrowLeft className="me-2" />
              Volver
            </Button>

            <Button
              className="reserva-entrada-btn"
              disabled={formularioIncompleto}
              onClick={handleSubmit}
            >
              Continuar
            </Button>
          </div>
          

        </Card.Body>
      </Card>
    </Container>
  );
};

export default LugarPaso;
