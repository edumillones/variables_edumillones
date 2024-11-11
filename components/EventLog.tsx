import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Event {
  timestamp: string
  message: string
  machine: string
  machineName: string
}

interface EventLogProps {
  events: Event[]
}

export default function EventLog({ events }: EventLogProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Registro de Eventos</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {events.map((event, index) => (
            <div key={index} className="mb-4 p-2 border rounded">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-primary">
                  Máquina: {event.machine} ({event.machineName})
                </span>
                <span className="text-sm text-muted-foreground">
                  {event.timestamp}
                </span>
              </div>
              <div className="text-sm">{event.message}</div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}