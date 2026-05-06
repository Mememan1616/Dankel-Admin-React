import { useState, useEffect, useMemo } from "react";
import type { FormaTrabajo } from "../../../interfaces/forma_trabajo";
import { ApiService } from "../../../services/ApiService";
import { Edit, Trash2, Search, Filter, Briefcase, Plus } from "lucide-react";
import FormularioFormaTrabajo from "./formularioFormaTrabajo";

export default function FormasTrabajoCrud() {
  const [formas, setFormas] = useState<FormaTrabajo[]>([]);

  // --- ESTADOS PARA EL MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [action, setAction] = useState("");
  const [selectedForma, setSelectedForma] = useState<FormaTrabajo | null>(null);
  const [title, setTitle] = useState("");

  // --- ESTADOS PARA FILTROS ---
  const [searchTerm, setSearchTerm] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroEstatus, setFiltroEstatus] = useState("todos");

  const getAllFormasTrabajo = async () => {
    const formasData: FormaTrabajo[] = await ApiService.getAllFormasTrabajo();
    setFormas(formasData);
  };

  // 2. DESPUÉS la mandas a llamar en el useEffect
  useEffect(() => {
    getAllFormasTrabajo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- FUNCIÓN PARA ABRIR EL FORMULARIO ---
  const MostrarFormulario = (action: string, forma?: FormaTrabajo) => {
    setTitle(action + " forma de trabajo");
    setIsModalOpen(true);
    setAction(action);

    if (forma) {
      setSelectedForma(forma);
    } else {
      setSelectedForma(null);
    }
  };

  // --- FUNCIÓN PARA CAMBIAR ESTATUS DIRECTO EN TABLA ---
  const handleToggleEstatus = async (forma: FormaTrabajo) => {
    try {
      const formaActualizada = { ...forma, estatus: !forma.estatus };
      const response = await ApiService.updateFormaTrabajo(formaActualizada);
      if (response.success) {
        getAllFormasTrabajo();
      } else {
        alert("Hubo un error al actualizar el estatus.");
      }
    } catch (error) {
      console.error("Error al actualizar estatus:", error);
      alert("Error de conexión al intentar actualizar el estatus.");
    }
  };

  // --- LÓGICA DE FILTRADO ---
  const formasFiltradas = useMemo(() => {
    return formas.filter((forma) => {
      const busqueda = searchTerm.toLowerCase();

      const strNombre = String(forma.nombre || "").toLowerCase();
      const strDesc = String(forma.descripcion || "").toLowerCase();

      // 1. Búsqueda por texto
      const coincideTexto =
        strNombre.includes(busqueda) || strDesc.includes(busqueda);

      // 2. Filtro por Estatus
      const coincideEstatus =
        filtroEstatus === "todos"
          ? true
          : filtroEstatus === "activos"
            ? forma.estatus === true
            : forma.estatus === false;

      return coincideTexto && coincideEstatus;
    });
  }, [formas, searchTerm, filtroEstatus]);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white capitalize">
            Formas de Trabajo
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Administra y visualiza las distintas formas y métodos de trabajo.
          </p>
        </div>

        <button
          onClick={() => MostrarFormulario("Crear")}
          className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg shadow-md font-medium text-sm transition-all flex items-center justify-center gap-2 focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 dark:focus:ring-offset-slate-900"
        >
          <Plus className="w-4 h-4" /> Nuevo Registro
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white dark:bg-slate-950 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 transition-colors"
            />
          </div>
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
              mostrarFiltros
                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"
            }`}
          >
            <Filter className="w-4 h-4" />{" "}
            {mostrarFiltros ? "Ocultar Filtros" : "Filtros"}
          </button>
        </div>

        {mostrarFiltros && (
          <div className="flex flex-col sm:flex-row gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Estatus
              </label>
              <select
                value={filtroEstatus}
                onChange={(e) => setFiltroEstatus(e.target.value)}
                className="w-full sm:w-48 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none text-slate-700 dark:text-slate-200"
              >
                <option value="todos">Todos</option>
                <option value="activos">Activos</option>
                <option value="inactivos">Inactivos</option>
              </select>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-950 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-full">
              <thead>
                <tr>
                  <th className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200 w-1/4">
                    Nombre
                  </th>
                  <th className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200 w-2/4">
                    Descripción
                  </th>
                  <th className="px-6 py-4 font-medium text-center text-slate-700 dark:text-slate-200">
                    Estatus
                  </th>
                  <th className="px-6 py-4 font-medium text-right text-slate-700 dark:text-slate-200">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {formasFiltradas.length > 0 ? (
                  formasFiltradas.map((forma) => {
                    return (
                      <tr
                        key={forma.id_forma_trabajo}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-500 shrink-0">
                              <Briefcase className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">
                                {forma.nombre}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {forma.id_forma_trabajo}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p
                            className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-sm"
                            title={forma.descripcion}
                          >
                            {forma.descripcion || (
                              <span className="italic text-slate-400">
                                Sin descripción
                              </span>
                            )}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span
                              className={`text-xs font-medium ${forma.estatus ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}
                            >
                              {forma.estatus ? "Activo" : "Inactivo"}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleEstatus(forma)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${forma.estatus ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}
                              title={
                                forma.estatus
                                  ? "Desactivar forma de trabajo"
                                  : "Activar forma de trabajo"
                              }
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${forma.estatus ? "translate-x-6" : "translate-x-1"}`}
                              />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                              title="Editar"
                              onClick={() => MostrarFormulario("Editar", forma)}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="Eliminar"
                              onClick={() =>
                                MostrarFormulario("Eliminar", forma)
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"
                    >
                      No se encontraron formas de trabajo con los filtros
                      actuales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- COMPONENTE DEL FORMULARIO --- */}
      <FormularioFormaTrabajo
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedForma(null);
          setAction("");
        }}
        title={title}
        action={action}
        refreshData={getAllFormasTrabajo}
        forma={selectedForma ? selectedForma : undefined}
        existingFormas={formas}
      />
    </>
  );
}
