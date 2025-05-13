"use client"

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Award, Heart, Star, Zap } from 'lucide-react'

const stats = [
  {
    icon: Star,
    value: "Coming Soon",
    label: "Active Users"
  },
  {
    icon: Award,
    value: "95%",
    label: "Success Rate"
  },
  {
    icon: Heart,
    value: "4.9/5",
    label: "User Rating"
  },
  {
    icon: Zap,
    value: "24/7",
    label: "AI Support"
  }
]

const StatCard = ({ icon: Icon, value, label, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-lg"
    >
      <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl shadow-lg">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="mt-4 text-center">
        <div className="text-3xl font-bold text-gray-900">{value}</div>
        <div className="mt-1 text-sm text-gray-600">{label}</div>
      </div>
    </motion.div>
  )
}

export default function About() {
  return (
    <section id="about" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold text-gray-900">
              Transforming Athletes with
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}AI Technology
              </span>
            </h2>
            <p className="mt-6 text-xl text-gray-600">
              We&apos;re on a mission to revolutionize athletic training by combining cutting-edge AI technology with proven sports science principles.
            </p>
            <p className="mt-4 text-gray-600">
              Our platform adapts to your unique needs, providing personalized training plans that evolve as you progress. Whether you&apos;re a beginner or a professional athlete, we&apos;re here to help you achieve your peak performance.
            </p>
            
            <div className="mt-12 grid grid-cols-2 gap-6">
              {stats.map((stat, index) => (
                <StatCard key={stat.label} {...stat} index={index} />
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl transform rotate-6 blur-lg opacity-30" />
            <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden">
              <div className="aspect-w-4 aspect-h-3">
                <Image
                  src="/about-image.jpg"
                  alt="Athletes training"
                  className="object-cover"
                  width={800}
                  height={600}
                  priority
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-sm font-medium text-gray-900">Trusted by professional athletes worldwide</div>
                  <div className="mt-1 text-sm text-gray-600">Join thousands of athletes who have transformed their training with our AI-powered platform</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
} 