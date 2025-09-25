"use client"

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'
import Image from 'next/image'

interface Testimonial {
  id: string
  name: string
  role: string
  avatar: string
  content: string
  rating: number
  sport?: string
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'Marathon Runner',
    avatar: '/avatars/sarah.jpg',
    content: 'Kasoku transformed my training completely. The AI insights helped me shave 15 minutes off my marathon time while preventing injury. The personalized plans adapt perfectly to my schedule.',
    rating: 5,
    sport: 'Running'
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    role: 'Powerlifter',
    avatar: '/avatars/marcus.jpg',
    content: 'The periodization features are incredible. My coach and I use Kasoku to plan my competition prep, and the analytics help us make data-driven decisions about my training.',
    rating: 5,
    sport: 'Powerlifting'
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    role: 'CrossFit Athlete',
    avatar: '/avatars/emily.jpg',
    content: 'As a competitive CrossFit athlete, I need precise tracking and smart programming. Kasoku delivers both with an interface that actually makes sense.',
    rating: 5,
    sport: 'CrossFit'
  },
  {
    id: '4',
    name: 'David Kim',
    role: 'Personal Trainer',
    avatar: '/avatars/david.jpg',
    content: 'I manage 20+ clients with Kasoku. The group management features and individual analytics save me hours each week while delivering better results for my athletes.',
    rating: 5,
    sport: 'Training'
  },
  {
    id: '5',
    name: 'Lisa Thompson',
    role: 'Triathlete',
    avatar: '/avatars/lisa.jpg',
    content: 'Training for three sports is complex, but Kasoku makes it manageable. The AI balances my swim, bike, and run training perfectly based on my goals and recovery.',
    rating: 5,
    sport: 'Triathlon'
  },
  {
    id: '6',
    name: 'Alex Rivera',
    role: 'Strength Coach',
    avatar: '/avatars/alex.jpg',
    content: 'The comparative analytics help my athletes understand where they stand and what they need to improve. It\'s like having a sports scientist on the team.',
    rating: 5,
    sport: 'Strength Training'
  }
]

interface TestimonialCardProps {
  testimonial: Testimonial
  index: number
}

const TestimonialCard = ({ testimonial, index }: TestimonialCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="relative p-6 bg-white dark:bg-card rounded-2xl shadow-lg dark:shadow-xl border border-gray-100 dark:border-border/50 hover:shadow-xl dark:hover:shadow-2xl transition-shadow duration-300"
    >
      <div className="absolute -top-3 -left-3 p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg shadow-lg">
        <Quote className="h-4 w-4 text-white" />
      </div>
      
      <div className="flex items-center gap-1 mb-4 mt-2">
        {[...Array(testimonial.rating)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      
      <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
        "{testimonial.content}"
      </p>
      
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {testimonial.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
        </div>
        <div>
          <div className="font-semibold text-gray-900 dark:text-gray-100">
            {testimonial.name}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {testimonial.role}
          </div>
          {testimonial.sport && (
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              {testimonial.sport}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function Testimonials() {
  return (
    <section className="py-20 bg-gray-50 dark:bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold text-gray-900 dark:text-gray-100"
          >
            Trusted by
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              {" "}Elite Athletes
            </span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
          >
            See how Kasoku is helping athletes and coaches achieve their goals
          </motion.p>
        </div>

        {/* Stats Row */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">10k+</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Athletes</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">500+</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Certified Coaches</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">1M+</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Workouts Completed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">4.9</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Average Rating</div>
          </div>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
} 