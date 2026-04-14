import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import MainNavbar from "../componentes/NavBar";
import "../../estilos/Botones.css";
import "../../estilos/ProgressBarEvento.css";

export interface Evento {
  tipo: string;
  tituloEvento: string;
  descripcionEvento: string;
  imagen: File | null;
  fecha: string;
  lugar: string;
  ubicacion: string;
  localidade?: string;
  nota_lugar?: string;
  coordenadas?: number[];
  esAuditorio?: boolean;
  entradas: number;
  precio: string;
  iban: string;
  tipo_gestion_entrada?: "pagina" | "manual" | "gratis" | null;
  procedimiento_cobro_manual?: string;
  condicionesConfirmacion: boolean;
  precios_zona?: { [zona: string]: string };
}

export interface OutletContext {
  evento: Evento;
  setEvento: React.Dispatch<React.SetStateAction<Evento>>;
}

export function CreateEventLayout() {
  const defaultEvento: Evento = {
    tipo: "",
    tituloEvento: "",
    descripcionEvento: "",
    imagen: null as File | null,
    fecha: "",
    lugar: "",
    ubicacion: "",
    localidade: "",
    nota_lugar: "",
    coordenadas: [],
    entradas: 0,
    precio: "", 
    iban: "",
    tipo_gestion_entrada: null,
    procedimiento_cobro_manual: "",
    esAuditorio: false,
    condicionesConfirmacion: false,
  };

  const [evento, setEvento] = useState<Evento>(() => {
    try {
      const raw = localStorage.getItem("eventoDraft");
      if (!raw) return defaultEvento;
      const parsed = JSON.parse(raw);
      return {
        ...defaultEvento,
        ...parsed,
        imagen: null,
      } as Evento;
    } catch (e) {
      return defaultEvento;
    }
  });

  // Gardar automaticamente no localStorage cada vez que `evento` cambia.
  useEffect(() => {
    try {
      const toSave = { ...evento, imagen: null } as any;
      localStorage.setItem("eventoDraft", JSON.stringify(toSave));
    } catch (e) {
      // Non bloqueamos a UI por erros de almacenamiento
      console.warn("Non se puido gardar eventoDraft en localStorage", e);
    }
  }, [evento]);

  const location = useLocation();

  const pasos = [
    "/crear-evento/tipo",
    "/crear-evento/titulo",
    "/crear-evento/cartel",
    "/crear-evento/fecha",
    "/crear-evento/lugar",
    "/crear-evento/entradas",
    "/crear-evento/gestion-entradas",
    "/crear-evento/prezo",
    "/crear-evento/condiciones-legales",
    "/crear-evento/resumen",
  ];

  const currentStep = pasos.findIndex((p) => location.pathname.startsWith(p)) + 1;

  //const progress = (currentStep / totalSteps) * 100;

  return (
    <>
      <MainNavbar />
      <div className="steps-container">
      {pasos.map((_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;

        return (
          <div key={index} className="step-wrapper">
            <div
              className={`step-circle 
                ${isCompleted ? "completed" : ""} 
                ${isActive ? "active" : ""}`}
            >
              {stepNumber}
            </div>

            {index !== pasos.length - 1 && (
              <div
                className={`step-line ${
                  stepNumber < currentStep ? "line-completed" : ""
                }`}
              />
            )}
          </div>
        );
      })}
      </div>

      <Outlet context={{ evento, setEvento }} />
      {console.log("Evento actual:", evento)}
    </>
  );
}
