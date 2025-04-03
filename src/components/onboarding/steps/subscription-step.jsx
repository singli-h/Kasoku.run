"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X, CreditCard, Calendar, Lock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SubscriptionStep({ userData, updateUserData, onNext, onPrev }) {
  const [selectedPlan, setSelectedPlan] = useState(userData.subscription || "free")
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [errors, setErrors] = useState({})
  const [paymentData, setPaymentData] = useState({
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvc: ""
  })

  const validatePaymentForm = () => {
    const newErrors = {}
    if (selectedPlan !== "free") {
      if (!paymentData.cardName) newErrors.cardName = "Name is required"
      if (!paymentData.cardNumber) newErrors.cardNumber = "Card number is required"
      if (!paymentData.expiry) newErrors.expiry = "Expiry date is required"
      if (!paymentData.cvc) newErrors.cvc = "CVC is required"
      
      // Card number validation (16 digits)
      if (paymentData.cardNumber && !/^\d{16}$/.test(paymentData.cardNumber.replace(/\s/g, ''))) {
        newErrors.cardNumber = "Invalid card number"
      }
      
      // Expiry date validation (MM/YY)
      if (paymentData.expiry && !/^\d{2}\/\d{2}$/.test(paymentData.expiry)) {
        newErrors.expiry = "Invalid format (MM/YY)"
      }
      
      // CVC validation (3-4 digits)
      if (paymentData.cvc && !/^\d{3,4}$/.test(paymentData.cvc)) {
        newErrors.cvc = "Invalid CVC"
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan)
    updateUserData({ subscription: plan })
    setShowPaymentForm(plan !== "free")
  }

  const handleContinue = () => {
    if (selectedPlan === "free" || validatePaymentForm()) {
      updateUserData({ subscription: selectedPlan })
      onNext()
    }
  }

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(" ")
    } else {
      return value
    }
  }

  const handleInputChange = (field, value) => {
    let formattedValue = value
    if (field === "cardNumber") {
      formattedValue = formatCardNumber(value)
    } else if (field === "expiry") {
      // Format MM/YY
      formattedValue = value
        .replace(/\D/g, "")
        .replace(/^(\d{2})/, "$1/")
        .substr(0, 5)
    } else if (field === "cvc") {
      formattedValue = value.replace(/\D/g, "").substr(0, 4)
    }
    
    setPaymentData(prev => ({
      ...prev,
      [field]: formattedValue
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
  }

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "£0",
      period: "forever",
      description: "Basic features for individual athletes",
      features: [
        { included: true, text: "Performance tracking" },
        { included: true, text: "Basic analytics" },
        { included: true, text: "1 training plan" },
        { included: false, text: "AI-powered insights" },
        { included: false, text: "Advanced analytics" },
        { included: false, text: "Coach collaboration" },
      ],
    },
    {
      id: "pro",
      name: "Pro",
      price: "£9.99",
      period: "per month",
      description: "Advanced features for serious athletes",
      popular: true,
      features: [
        { included: true, text: "Everything in Free" },
        { included: true, text: "Unlimited training plans" },
        { included: true, text: "Advanced analytics" },
        { included: true, text: "AI-powered insights" },
        { included: true, text: "Coach collaboration" },
        { included: false, text: "Team management" },
      ],
    },
    {
      id: "elite",
      name: "Elite",
      price: "£19.99",
      period: "per month",
      description: "Complete solution for coaches and teams",
      features: [
        { included: true, text: "Everything in Pro" },
        { included: true, text: "Team management" },
        { included: true, text: "Unlimited athletes" },
        { included: true, text: "Custom branding" },
        { included: true, text: "Priority support" },
        { included: true, text: "API access" },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">Choose Your Plan</h2>
        <p className="text-lg text-white/70 mt-2">Select the plan that best fits your needs</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <motion.div key={plan.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card
              className={`relative h-full cursor-pointer bg-[#262C3A] hover:bg-[#2E364A] border-2 transition-all duration-300 ${
                selectedPlan === plan.id
                  ? "border-[#4F46E5] ring-2 ring-[#4F46E5] ring-opacity-50"
                  : "border-white/20 hover:border-[#4F46E5]/70"
              }`}
              onClick={() => handlePlanSelect(plan.id)}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 right-4 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white border-0 px-3 py-1 text-sm font-medium shadow-lg shadow-indigo-500/30">
                  Popular
                </Badge>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-white/80 font-medium">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">{plan.price}</span>
                  <span className="text-white/80 ml-2">{plan.period}</span>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-[#4F46E5] shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
                      )}
                      <span className={feature.included ? "text-white/90" : "text-white/40"}>{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  variant={selectedPlan === plan.id ? "default" : "outline"}
                  className={`w-full py-6 text-base font-medium ${
                    selectedPlan === plan.id 
                      ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white border-0 hover:from-[#4338CA] hover:to-[#6D28D9] shadow-lg shadow-indigo-500/30"
                      : "bg-[#262C3A] border-white/20 text-white hover:bg-[#2E364A] hover:border-white/30"
                  }`}
                >
                  {selectedPlan === plan.id ? "Selected" : "Select Plan"}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>

      {showPaymentForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-10 border-2 border-white/20 rounded-xl p-8 bg-[#262C3A]"
        >
          <h3 className="text-xl font-bold mb-6 flex items-center gap-3 bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">
            <CreditCard className="w-6 h-6 text-[#4F46E5]" />
            Payment Details
          </h3>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="cardName" className="text-white/90 font-medium">Name on Card</Label>
                <Input
                  id="cardName"
                  placeholder="John Smith"
                  value={paymentData.cardName}
                  onChange={(e) => handleInputChange("cardName", e.target.value)}
                  className={`bg-[#1E1E2E] border-white/20 text-white h-12 ${
                    errors.cardName ? "border-red-500" : "focus:border-[#4F46E5]"
                  }`}
                />
                {errors.cardName && (
                  <p className="text-red-500 text-sm">{errors.cardName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardNumber" className="text-white/90 font-medium">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={paymentData.cardNumber}
                  onChange={(e) => handleInputChange("cardNumber", e.target.value)}
                  maxLength={19}
                  className={`bg-[#1E1E2E] border-white/20 text-white h-12 ${
                    errors.cardNumber ? "border-red-500" : "focus:border-[#4F46E5]"
                  }`}
                />
                {errors.cardNumber && (
                  <p className="text-red-500 text-sm">{errors.cardNumber}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="expiry" className="text-white/90 font-medium">Expiry Date</Label>
                <div className="relative">
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={paymentData.expiry}
                    onChange={(e) => handleInputChange("expiry", e.target.value)}
                    maxLength={5}
                    className={`bg-[#1E1E2E] border-white/20 text-white h-12 ${
                      errors.expiry ? "border-red-500" : "focus:border-[#4F46E5]"
                    }`}
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                </div>
                {errors.expiry && (
                  <p className="text-red-500 text-sm">{errors.expiry}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc" className="text-white/90 font-medium">CVC</Label>
                <div className="relative">
                  <Input
                    id="cvc"
                    placeholder="123"
                    value={paymentData.cvc}
                    onChange={(e) => handleInputChange("cvc", e.target.value)}
                    maxLength={4}
                    className={`bg-[#1E1E2E] border-white/20 text-white h-12 ${
                      errors.cvc ? "border-red-500" : "focus:border-[#4F46E5]"
                    }`}
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                </div>
                {errors.cvc && (
                  <p className="text-red-500 text-sm">{errors.cvc}</p>
                )}
              </div>
            </div>

            <div className="pt-2 text-sm text-white/80 flex items-center gap-2 bg-[#4F46E5]/10 p-4 rounded-lg border border-[#4F46E5]/20">
              <Lock className="w-5 h-5 text-[#4F46E5]" />
              Your payment information is secured with 256-bit encryption
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex justify-between pt-8">
        <Button 
          variant="outline" 
          onClick={onPrev}
          className="bg-[#262C3A] border-white/20 text-white hover:bg-[#2E364A] hover:border-white/30 px-8"
        >
          Back
        </Button>
        <Button 
          onClick={handleContinue}
          className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white border-0 hover:from-[#4338CA] hover:to-[#6D28D9] shadow-lg shadow-indigo-500/30 px-8"
        >
          {selectedPlan === "free" ? "Continue" : "Subscribe & Continue"}
        </Button>
      </div>
    </div>
  )
} 