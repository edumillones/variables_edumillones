'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Mic, Download } from 'lucide-react'
import AudioVisualizer from '@/components/AudioVisualizer'
import FrequencySpectrum from '@/components/FrequencySpectrum'
import FourierDerivative from '@/components/FourierDerivative'
import ProcessStatus from '@/components/ProcessStatus'
import EventLog from '@/components/EventLog'

export default function Page() {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [processState, setProcessState] = useState<'normal' | 'warning' | 'critical' | 'irregular'>('normal')
  const [expandedChart, setExpandedChart] = useState<string | null>(null)
  const [events, setEvents] = useState<Array<{ timestamp: string, message: string, machine: string, machineName: string }>>([])
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')
  const [sensitivity, setSensitivity] = useState(50)
  const [autoDetectAnomalies, setAutoDetectAnomalies] = useState(true)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    const initAudio = () => {
      if (!audioContext) {
        try {
          const newAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          setAudioContext(newAudioContext)
          const newAnalyserNode = newAudioContext.createAnalyser()
          newAnalyserNode.fftSize = 2048
          setAnalyserNode(newAnalyserNode)
        } catch (error) {
          console.error('Failed to initialize audio context:', error)
          addEvent('Error al inicializar el contexto de audio', 'SYS-01', 'Sistema de Audio')
        }
      }
    }

    window.addEventListener('click', initAudio, { once: true })

    return () => {
      window.removeEventListener('click', initAudio)
      if (audioContext) {
        audioContext.close()
      }
    }
  }, [audioContext])

  const startRecording = async () => {
    try {
      if (!audioContext || !analyserNode) {
        throw new Error('Audio context not initialized')
      }

      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      
      mediaStreamRef.current = stream

      const source = audioContext.createMediaStreamSource(stream)
      sourceRef.current = source

      source.connect(analyserNode)
      
      setIsRecording(true)
      addEvent('Grabación iniciada', 'MIC-01', 'Micrófono Principal')
    } catch (error) {
      console.error('Error accessing microphone:', error)
      addEvent('Error al iniciar la grabación', 'MIC-01', 'Micrófono Principal')
    }
  }

  const stopRecording = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      
      if (sourceRef.current) {
        sourceRef.current.disconnect()
        sourceRef.current = null
      }
      
      mediaStreamRef.current = null
      setIsRecording(false)
      addEvent('Grabación detenida', 'MIC-01', 'Micrófono Principal')
    }
  }

  const handleExpand = (chartId: string) => {
    setExpandedChart(expandedChart === chartId ? null : chartId)
  }

  const addEvent = useCallback((message: string, machine: string, machineName: string) => {
    if (isMountedRef.current) {
      setEvents(prevEvents => [{
        timestamp: new Date().toLocaleString(),
        message,
        machine,
        machineName
      }, ...prevEvents])
    }
  }, [])

  const handleMaxValueChange = useCallback((maxValue: number) => {
    if (isMountedRef.current) {
      if (maxValue >= 1.6) {
        setProcessState('irregular')
        addEvent('Señal irregular detectada', 'PROC-01', 'Procesador de Señales')
      } else {
        setProcessState('normal')
      }
    }
  }, [addEvent])

  const exportResults = () => {
    console.log('Exportando resultados...')
    addEvent('Resultados exportados', 'EXP-01', 'Módulo de Exportación')
  }

  useEffect(() => {
    return () => {
      stopRecording()
      if (audioContext) {
        audioContext.close()
      }
    }
  }, [])

  return (
    <div className="container mx-auto p-2 sm:p-4 pt-8">
      <div className="mt-8 mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-400 bg-clip-text text-transparent">
          Incidencia de las señales acústicas en el sistema auditivo y su análisis mediante Transformada de Fourier
        </h1>
        <a 
          href="https://docs.google.com/document/d/1wVy2BIcuZvtLJzLFU3NgGFW2aayAv1kvD2sGd_fP19k/edit?usp=sharing" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-500 hover:text-blue-700 transition-colors duration-200"
        >
          Ver Informe de Investigación
        </a>
      </div>
      <div className="grid gap-4 mb-4">
        <Card>
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Button onClick={isRecording ? stopRecording : startRecording} className="w-full sm:w-auto">
                <Mic className="mr-2 h-4 w-4" />
                {isRecording ? 'Detener Grabación' : 'Iniciar Grabación'}
              </Button>
              <Button onClick={exportResults} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Exportar Resultados
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chart-type">Tipo de Gráfico</Label>
                <Select value={chartType} onValueChange={(value: 'line' | 'bar') => setChartType(value)}>
                  <SelectTrigger id="chart-type">
                    <SelectValue placeholder="Seleccionar tipo de gráfico" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line">Línea</SelectItem>
                    <SelectItem value="bar">Barra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sensitivity">Sensibilidad</Label>
                <Slider
                  id="sensitivity"
                  min={0}
                  max={100}
                  step={1}
                  value={[sensitivity]}
                  onValueChange={(value) => setSensitivity(value[0])}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-detect"
                checked={autoDetectAnomalies}
                onCheckedChange={setAutoDetectAnomalies}
              />
              <Label htmlFor="auto-detect">Detección Automática de Anomalías</Label>
            </div>
          </CardContent>
        </Card>
        <ProcessStatus state={processState} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <AudioVisualizer
          analyserNode={analyserNode}
          chartType={chartType}
          isExpanded={expandedChart === 'audio'}
          onExpand={() => handleExpand('audio')}
          onMaxValueChange={handleMaxValueChange}
        />
        <FrequencySpectrum
          analyserNode={analyserNode}
          chartType={chartType}
          isExpanded={expandedChart === 'frequency'}
          onExpand={() => handleExpand('frequency')}
        />
        <FourierDerivative
          analyserNode={analyserNode}
          chartType={chartType}
          isExpanded={expandedChart === 'fourier'}
          onExpand={() => handleExpand('fourier')}
        />
      </div>
      <EventLog events={events} />
      <footer className="mt-8 text-center text-sm">
        <a href="https://edumillones.vercel.app/" className="bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent hover:from-purple-500 hover:to-pink-400 transition-all duration-300">
          by @edu.millones
        </a>
      </footer>
    </div>
  )
}