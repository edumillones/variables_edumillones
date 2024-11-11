'use client'

import { useState, useEffect, useRef } from 'react'
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

  // Initialize audio context when component mounts
  useEffect(() => {
    // Create audio context only on user interaction
    const initAudio = () => {
      if (!audioContext) {
        const newAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        setAudioContext(newAudioContext)
        const newAnalyserNode = newAudioContext.createAnalyser()
        newAnalyserNode.fftSize = 2048
        setAnalyserNode(newAnalyserNode)
      }
    }

    // Add event listener for user interaction
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

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      
      // Store the stream reference
      mediaStreamRef.current = stream

      // Create and store the source node
      const source = audioContext.createMediaStreamSource(stream)
      sourceRef.current = source

      // Connect the audio graph
      source.connect(analyserNode)
      
      setIsRecording(true)
      addEvent('Grabación iniciada', 'MIC-01', 'Micrófono Principal')
      
      // Resume audio context if it's suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }
    } catch (error) {
      console.error('Error accessing microphone:', error)
      addEvent('Error al iniciar la grabación', 'MIC-01', 'Micrófono Principal')
    }
  }

  const stopRecording = () => {
    if (mediaStreamRef.current) {
      // Stop all tracks in the stream
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      
      // Disconnect the source if it exists
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

  const addEvent = (message: string, machine: string, machineName: string) => {
    const newEvent = {
      timestamp: new Date().toLocaleString(),
      message,
      machine,
      machineName
    }
    setEvents(prevEvents => [newEvent, ...prevEvents])
  }

  const handleMaxValueChange = (maxValue: number) => {
    if (maxValue >= 1.6) {
      setProcessState('irregular')
      addEvent('Señal irregular detectada', 'PROC-01', 'Procesador de Señales')
    } else {
      setProcessState('normal')
    }
  }

  const exportResults = () => {
    console.log('Exportando resultados...')
    addEvent('Resultados exportados', 'EXP-01', 'Módulo de Exportación')
  }

  // Clean up audio resources when component unmounts
  useEffect(() => {
    return () => {
      stopRecording()
      if (audioContext) {
        audioContext.close()
      }
    }
  }, [])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Incidencia de las señales acústicas en el sistema auditivo y su análisis mediante Transformada de Fourier</h1>
      <div className="grid gap-4 mb-4">
        <Card>
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Button onClick={isRecording ? stopRecording : startRecording}>
                <Mic className="mr-2 h-4 w-4" />
                {isRecording ? 'Detener Grabación' : 'Iniciar Grabación'}
              </Button>
              <Button onClick={exportResults}>
                <Download className="mr-2 h-4 w-4" />
                Exportar Resultados
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
      <div className="grid grid-cols-3 gap-4 mb-4">
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
      <footer className="mt-8 text-center text-sm text-gray-500">
        <a href="https://edumillones.vercel.app/" className="hover:underline">by @edu.millones</a>
      </footer>
    </div>
  )
}