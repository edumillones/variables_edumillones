import { useRef, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react'

interface FrequencySpectrumProps {
  analyserNode: AnalyserNode | null
  chartType: 'line' | 'bar'
  isExpanded: boolean
  onExpand: () => void
}

export default function FrequencySpectrum({ analyserNode, chartType, isExpanded, onExpand }: FrequencySpectrumProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [peakFrequency, setPeakFrequency] = useState(0)

  useEffect(() => {
    if (!analyserNode || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 600 * zoomLevel
    canvas.height = 300 * zoomLevel

    const bufferLength = analyserNode.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      requestAnimationFrame(draw)

      analyserNode.getByteFrequencyData(dataArray)

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const barWidth = (canvas.width / bufferLength) * 2.5
      let barHeight
      let x = 0
      let maxFreq = 0
      let maxFreqValue = 0

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] * zoomLevel

        if (dataArray[i] > maxFreqValue) {
          maxFreqValue = dataArray[i]
          maxFreq = i * (analyserNode.context.sampleRate / analyserNode.fftSize)
        }

        const hue = (i / bufferLength) * 360
        ctx.fillStyle = `hsl(${hue}, 70%, 50%)`

        if (chartType === 'bar') {
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
        } else {
          if (i === 0) {
            ctx.beginPath()
            ctx.moveTo(x, canvas.height - barHeight)
          } else {
            ctx.lineTo(x, canvas.height - barHeight)
          }
        }

        x += barWidth + 1
      }

      if (chartType === 'line') {
        ctx.strokeStyle = 'rgb(0, 120, 255)'
        ctx.lineWidth = 2 * zoomLevel
        ctx.stroke()
      }

      setPeakFrequency(Math.round(maxFreq))

      ctx.font = `${12 * zoomLevel}px Arial`
      ctx.fillStyle = '#666666'
      ctx.fillText(`${Math.round(analyserNode.context.sampleRate / 2)}Hz`, canvas.width - 50 * zoomLevel, canvas.height - 10)
      ctx.fillText('0Hz', 10, canvas.height - 10)
      ctx.fillText(`${maxFreqValue}dB`, 10, 20 * zoomLevel)
    }

    draw()
  }, [analyserNode, chartType, zoomLevel])

  return (
    <Card className={`${isExpanded ? 'col-span-3' : ''} flex flex-col`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Espectro de Frecuencia</CardTitle>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setZoomLevel(prev => Math.max(1, prev - 0.5))}
            disabled={zoomLevel <= 1}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.5))}
            disabled={zoomLevel >= 3}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={onExpand}>
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex justify-center items-center bg-white p-4 rounded-lg">
        <div className="overflow-auto w-full h-full">
          <canvas 
            ref={canvasRef}
            style={{
              width: '100%',
              height: isExpanded ? '600px' : '300px',
              objectFit: 'contain'
            }}
          />
        </div>
      </CardContent>
      <div className="p-2 text-sm text-center text-muted-foreground">
        Zoom: {zoomLevel}x | Frecuencia pico: {peakFrequency}Hz
      </div>
    </Card>
  )
}