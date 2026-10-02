import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { Plus, X, Calendar, Scale, Ruler, Activity, Trash2, RefreshCw } from 'lucide-react'
import './App.css'

// Registrar módulos requeridos de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function App() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState('KG') // 'KG', '% GRASA', 'Cintura'
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Formulario
  const [formData, setFormData] = useState({
    peso: '',
    altura: '',
    fechaNacimiento: '2005-06-28', // Valor por defecto sugerido
    cintura: ''
  })

  // Cargar datos al iniciar
  useEffect(() => {
    fetchRecords()
  }, [])

  // Consultar la tabla "Medias"
  const fetchRecords = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('Medias')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error al obtener datos:', error)
      } else {
        setRecords(data || [])
      }
    } catch (err) {
      console.error('Error de red/servidor:', err)
    } finally {
      setLoading(false)
    }
  }

  // Guardar un nuevo registro
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.peso || !formData.altura) {
      alert('Por favor, ingresa peso y altura.')
      return
    }

    setSaving(true)

    // El Trigger "trigger_calcular_grasa" calculará automáticamente "% GRASA"
    const payload = {
      'PESO (KG)': formData.peso.toString(),
      'ALTURA (M)': formData.altura.toString(),
      'FECHA_NACIMIENTO': formData.fechaNacimiento || null,
      'Cintura (CM)': formData.cintura ? formData.cintura.toString() : null
    }

    const { error } = await supabase.from('Medias').insert([payload])

    if (error) {
      console.error('Error al guardar:', error)
      alert('Error al guardar el registro en Supabase: ' + error.message)
    } else {
      // Limpiar formulario y recargar datos
      setFormData({
        peso: '',
        altura: '',
        fechaNacimiento: formData.fechaNacimiento,
        cintura: ''
      })
      setIsModalOpen(false)
      fetchRecords()
    }
    setSaving(false)
  }

  // Eliminar un registro
  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return

    const { error } = await supabase.from('Medias').delete().eq('id', id)
    if (error) {
      alert('Error al eliminar: ' + error.message)
    } else {
      fetchRecords()
    }
  }

  // Formatear fechas para el eje X
  const labels = records.map((r) => {
    const fecha = new Date(r.created_at)
    return fecha.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
  })

  // Obtener los valores según la métrica seleccionada
  const getPrimaryMetricData = () => {
    return records.map((r) => {
      if (selectedMetric === 'KG') return parseFloat(r['PESO (KG)']) || 0
      if (selectedMetric === '% GRASA') return parseFloat(r['% GRASA']) || 0
      if (selectedMetric === 'Cintura') return parseFloat(r['Cintura (CM)']) || 0
      return 0
    })
  }

  // Segunda línea para comparación (ejemplo: % Grasa)
  const getSecondaryMetricData = () => {
    return records.map((r) => parseFloat(r['% GRASA']) || 0)
  }

  // Configuración del gráfico Chart.js
  const chartData = {
    labels: labels.length > 0 ? labels : ['Ene 1', 'Ene 2', 'Ene 3', 'Ene 4'],
    datasets: [
      {
        label: `${selectedMetric}`,
        data: labels.length > 0 ? getPrimaryMetricData() : [70, 69.5, 69, 68.8],
        borderColor: '#4285F4', // Azul primario
        backgroundColor: 'rgba(66, 133, 244, 0.1)',
        borderWidth: 3,
        tension: 0.3,
        pointBackgroundColor: '#4285F4',
        pointRadius: 4,
        fill: true
      },
      {
        label: '% Grasa (Ref)',
        data: labels.length > 0 ? getSecondaryMetricData() : [18, 17.8, 17.5, 17.2],
        borderColor: '#FBBC05', // Amarillo / Naranja del diseño
        backgroundColor: 'transparent',
        borderWidth: 3,
        borderDash: [5, 5],
        tension: 0.3,
        pointBackgroundColor: '#FBBC05',
        pointRadius: 3
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { font: { family: 'sans-serif', size: 12 } }
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(200, 200, 200, 0.2)' }
      },
      y: {
        grid: { color: 'rgba(200, 200, 200, 0.2)' }
      }
    }
  }

  return (
    <div className="app-container">
      {/* Contenedor tipo pantalla móvil central */}
      <div className="mobile-card">
        {/* Selector tipo Píldora superior */}
        <div className="pill-selector">
          <button
            className={`pill-btn ${selectedMetric === 'KG' ? 'active' : ''}`}
            onClick={() => setSelectedMetric('KG')}
          >
            KG
          </button>
          <button
            className={`pill-btn ${selectedMetric === '% GRASA' ? 'active' : ''}`}
            onClick={() => setSelectedMetric('% GRASA')}
          >
            % GRASA
          </button>
          <button
            className={`pill-btn ${selectedMetric === 'Cintura' ? 'active' : ''}`}
            onClick={() => setSelectedMetric('Cintura')}
          >
            CINTURA
          </button>
        </div>

        {/* Sección del Gráfico */}
        <div className="chart-container">
          {loading ? (
            <div className="loading-state">
              <RefreshCw className="spinner" />
              <span>Cargando datos de Supabase...</span>
            </div>
          ) : (
            <Line data={chartData} options={chartOptions} />
          )}
        </div>

        {/* Resumen de Últimos Registros */}
        <div className="history-section">
          <div className="history-header">
            <h3>Historial de Registros</h3>
            <button onClick={fetchRecords} className="icon-btn-text" title="Recargar">
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="history-list">
            {records.length === 0 ? (
              <p className="empty-msg">No hay registros guardados aún.</p>
            ) : (
              records.slice().reverse().map((r) => (
                <div key={r.id} className="history-item">
                  <div className="item-info">
                    <span className="item-date">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                    <div className="item-metrics">
                      <span><strong>{r['PESO (KG)']}</strong> kg</span>
                      <span><strong>{r['ALTURA (M)']}</strong> m</span>
                      {r['% GRASA'] && <span className="highlight-tag">{r['% GRASA']}% Grasa</span>}
                      {r['Cintura (CM)'] && <span>{r['Cintura (CM)']} cm</span>}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(r.id)} className="delete-btn">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Botón Flotante Cyan (+) */}
        <button
          className="fab-button"
          onClick={() => setIsModalOpen(true)}
          title="Agregar Medida"
        >
          <Plus size={32} />
        </button>
      </div>

      {/* Modal para ingresar nuevo registro */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Nuevo Registro</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label><Scale size={16} /> Peso (KG):</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ej: 72.5"
                  value={formData.peso}
                  onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label><Ruler size={16} /> Altura (M):</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ej: 1.70"
                  value={formData.altura}
                  onChange={(e) => setFormData({ ...formData, altura: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label><Calendar size={16} /> Fecha de Nacimiento:</label>
                <input
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label><Activity size={16} /> Cintura (CM) - Opcional:</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ej: 80"
                  value={formData.cintura}
                  onChange={(e) => setFormData({ ...formData, cintura: e.target.value })}
                />
              </div>

              <p className="hint-text">
                💡 <i>El % de Grasa Corporal será calculado automáticamente por el trigger de Supabase.</i>
              </p>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="save-btn" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar en Supabase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}