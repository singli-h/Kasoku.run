import { cn } from "../../lib/utils"

const Card = ({ children, className = "", ...props }) => {
  return (
    <div className={cn("rounded-lg", className)} {...props}>
      {children}
    </div>
  )
}

const CardHeader = ({ children, className = "", ...props }) => {
  return (
    <div className={cn("px-4 py-5 border-b border-gray-200 sm:px-6", className)} {...props}>
      {children}
    </div>
  )
}

const CardContent = ({ children, className = "", ...props }) => {
  return (
    <div className={cn("px-4 py-5 sm:p-6", className)} {...props}>
      {children}
    </div>
  )
}

const CardTitle = ({ children, className = "", ...props }) => {
  return (
    <h3 className={cn("text-lg leading-6 font-medium text-gray-900", className)} {...props}>
      {children}
    </h3>
  )
}

Card.Header = CardHeader
Card.Content = CardContent
Card.Title = CardTitle

export { Card, CardHeader, CardContent, CardTitle }

