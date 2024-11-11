import { AlertTriangle, CheckCircle, AlertCircle, AlertOctagon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ProcessStatusProps {
  state: 'normal' | 'warning' | 'critical' | 'irregular'
}

export default function ProcessStatus({ state }: ProcessStatusProps) {
  const getStatusInfo = () => {
    switch (state) {
      case 'normal':
        return { icon: <CheckCircle className="h-6 w-6 text-green-500" />, color: 'bg-green-100', text: 'Normal' }
      case 'warning':
        return { icon: <AlertTriangle className="h-6 w-6 text-yellow-500" />, color: 'bg-yellow-100', text: 'Advertencia' }
      case 'critical':
        return { icon: <AlertCircle className="h-6 w-6 text-red-500" />, color: 'bg-red-100', text: 'Crítico' }
      case 'irregular':
        return { icon: <AlertOctagon className="h-6 w-6 text-orange-500" />, color: 'bg-orange-100', text: 'Irregular' }
    }
  }

  const { icon, color, text } = getStatusInfo()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado del Proceso</CardTitle>
        <CardDescription>Estado actual del sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`flex items-center space-x-2 p-2 rounded ${color}`}>
          {icon}
          <span className="font-medium">{text}</span>
        </div>
      </CardContent>
    </Card>
  )
}