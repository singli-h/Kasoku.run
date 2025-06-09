"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  MoreVertical, 
  Settings, 
  RefreshCw, 
  Unplug, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Zap
} from "lucide-react"
import { Integration, IntegrationCardsProps } from "../types"
import { getIntegrationStatusConfig } from "../utils"
import { formatRelativeTime } from "../utils"

export function IntegrationCards({ 
  integrations, 
  onConnect, 
  onDisconnect, 
  onConfigure 
}: IntegrationCardsProps) {
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null)
  const [connectingId, setConnectingId] = useState<string | null>(null)

  const handleConnect = async (integrationId: string) => {
    setConnectingId(integrationId)
    try {
      await onConnect?.(integrationId)
    } finally {
      setConnectingId(null)
    }
  }

  const handleDisconnect = async (integrationId: string) => {
    try {
      await onDisconnect?.(integrationId)
    } finally {
      setDisconnectingId(null)
    }
  }

  const getStatusIcon = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'configure_required':
        return <Settings className="h-4 w-4 text-yellow-600" />
      case 'available':
      default:
        return <Zap className="h-4 w-4 text-blue-600" />
    }
  }

  const getActionButton = (integration: Integration) => {
    const isConnecting = connectingId === integration.id
    
    switch (integration.status) {
      case 'connected':
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onConfigure?.(integration.id)}>
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDisconnectingId(integration.id)}>
                <Unplug className="h-4 w-4 mr-2" />
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      
      case 'configure_required':
        return (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onConfigure?.(integration.id)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        )
      
      case 'error':
        return (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleConnect(integration.id)}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Retry
          </Button>
        )
      
      case 'available':
      default:
        return (
          <Button 
            size="sm"
            onClick={() => handleConnect(integration.id)}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Connect
          </Button>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Integrations</h3>
          <p className="text-sm text-muted-foreground">
            Connect your favorite tools to sync data with your knowledge base
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{integrations.filter(i => i.status === 'connected').length} connected</span>
          <Separator orientation="vertical" className="h-4" />
          <span>{integrations.length} total</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((integration) => {
          const statusConfig = getIntegrationStatusConfig(integration.status)
          
          return (
            <Card key={integration.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{integration.icon}</div>
                    <div>
                      <CardTitle className="text-base">{integration.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(integration.status)}
                        <Badge 
                          variant="secondary" 
                          className={statusConfig.color}
                        >
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {getActionButton(integration)}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <CardDescription className="text-sm mb-3">
                  {integration.description}
                </CardDescription>
                
                {/* Capabilities */}
                <div className="mb-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Capabilities</p>
                  <div className="flex flex-wrap gap-1">
                    {integration.capabilities.slice(0, 3).map((capability) => (
                      <Badge key={capability} variant="outline" className="text-xs">
                        {capability}
                      </Badge>
                    ))}
                    {integration.capabilities.length > 3 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="text-xs">
                              +{integration.capabilities.length - 3} more
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              {integration.capabilities.slice(3).map((capability) => (
                                <div key={capability} className="text-xs">{capability}</div>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>

                {/* Status Details */}
                {integration.status === 'connected' && integration.lastSync && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Last sync: {formatRelativeTime(integration.lastSync)}</span>
                  </div>
                )}

                {integration.status === 'error' && integration.errorMessage && (
                  <div className="flex items-center gap-2 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    <span>{integration.errorMessage}</span>
                  </div>
                )}

                {integration.status === 'configure_required' && (
                  <div className="flex items-center gap-2 text-xs text-yellow-600">
                    <Settings className="h-3 w-3" />
                    <span>Configuration required to complete setup</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={!!disconnectingId} onOpenChange={() => setDisconnectingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Integration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect this integration? This will stop data synchronization 
              and remove stored credentials. You can reconnect at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => disconnectingId && handleDisconnect(disconnectingId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 