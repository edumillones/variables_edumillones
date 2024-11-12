import { useRef, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react'

interface FourierDerivativeProps {
  analyserNode: AnalyserNode | null
  chartType: 'line' | 'bar'
  isExpanded: boolean
  onExpand: () => void
}

export default function FourierDerivative({ analyserNode, chartType, isExpanded, onExpand }: FourierDerivativeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [maxDerivative, setMaxDerivative] = useState(0)

  useEffect(() => {
    if (!analyserNode || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 600 * zoomLevel
    canvas.height = 300 * zoomLevel

    const bufferLength = analyserNode.frequencyBinCount
    const dataArray = new Float32Array(bufferLength)
    const derivativeArray = new Float32Array(bufferLength - 1)

    const draw = () => {
      requestAnimationFrame(draw)

      analyserNode.getFloatFrequencyData(dataArray)

      let maxDeriv = 0
      for (let i = 0; i < bufferLength - 1; i++) {
        derivativeArray[i] = dataArray[i + 1] - dataArray[i]
        maxDeriv = Math.max(maxDeriv, Math.abs(derivativeArray[i]))
      }

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.lineWidth = 2 * zoomLevel
      ctx.strokeStyle = 'rgb(0, 120, 255)'
      ctx.beginPath()

      const sliceWidth = canvas.width * 1.0 / (bufferLength - 1)
      let x = 0

      for (let i = 0; i < bufferLength - 1; i++) {
        const v = (derivativeArray[i] / maxDeriv) * 0.5 + 0.5
        const y = v * canvas.height

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }

        x += sliceWidth
      }

      ctx.stroke()

      setMaxDerivative(maxDeriv)

      ctx.font = `${12 * zoomLevel}px Arial`
      ctx.fillStyle = '#666666'
      ctx.fillText(`Max: ${maxDeriv.toFixed(2)}`, 10, 20 * zoomLevel)
      ctx.fillText('0', 10, canvas.height / 2)
      ctx.fillText(`+${maxDeriv.toFixed(2)}`, 10, 20 * zoomLevel)
      ctx.fillText(`-${maxDeriv.toFixed(2)}`, 10, canvas.height - 10)
    }

    draw()
  }, [analyserNode, zoomLevel])

  return (
    <Card className={`${isExpanded ? 'md:col-span-2 lg:col-span-3' : ''} flex flex-col`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Derivada de Fourier</CardTitle>
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
        Zoom: {zoomLevel}x | Derivada máxima: {maxDerivative.toFixed(2)}
      </div>
    </Card>
  )
}