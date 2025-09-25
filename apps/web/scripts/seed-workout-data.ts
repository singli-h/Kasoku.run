/**
 * Workout Data Seeding Script
 * Comprehensive script to seed workout-related data for development
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Sample data
const exerciseTypes = [
  { name: 'Strength', description: 'Resistance training exercises' },
  { name: 'Cardio', description: 'Cardiovascular exercises' },
  { name: 'Flexibility', description: 'Stretching and mobility exercises' },
  { name: 'Balance', description: 'Balance and stability exercises' },
  { name: 'Plyometric', description: 'Explosive movement exercises' }
]

const exercises = [
  // Strength exercises
  { name: 'Push-ups', description: 'Classic bodyweight exercise', exercise_type: 'Strength' },
  { name: 'Squats', description: 'Lower body strength exercise', exercise_type: 'Strength' },
  { name: 'Pull-ups', description: 'Upper body pulling exercise', exercise_type: 'Strength' },
  { name: 'Deadlifts', description: 'Hip hinge movement', exercise_type: 'Strength' },
  { name: 'Bench Press', description: 'Chest and tricep exercise', exercise_type: 'Strength' },
  { name: 'Overhead Press', description: 'Shoulder and tricep exercise', exercise_type: 'Strength' },
  { name: 'Rows', description: 'Back and bicep exercise', exercise_type: 'Strength' },
  { name: 'Lunges', description: 'Single leg strength exercise', exercise_type: 'Strength' },
  
  // Cardio exercises
  { name: 'Running', description: 'Cardiovascular endurance exercise', exercise_type: 'Cardio' },
  { name: 'Cycling', description: 'Low-impact cardio exercise', exercise_type: 'Cardio' },
  { name: 'Swimming', description: 'Full body cardio exercise', exercise_type: 'Cardio' },
  { name: 'Jump Rope', description: 'High-intensity cardio exercise', exercise_type: 'Cardio' },
  { name: 'Burpees', description: 'Full body cardio exercise', exercise_type: 'Cardio' },
  { name: 'Mountain Climbers', description: 'High-intensity cardio exercise', exercise_type: 'Cardio' },
  
  // Flexibility exercises
  { name: 'Downward Dog', description: 'Yoga pose for flexibility', exercise_type: 'Flexibility' },
  { name: 'Pigeon Pose', description: 'Hip flexibility exercise', exercise_type: 'Flexibility' },
  { name: 'Forward Fold', description: 'Hamstring stretch', exercise_type: 'Flexibility' },
  { name: 'Cat-Cow Stretch', description: 'Spinal mobility exercise', exercise_type: 'Flexibility' },
  
  // Balance exercises
  { name: 'Single Leg Stand', description: 'Basic balance exercise', exercise_type: 'Balance' },
  { name: 'Tree Pose', description: 'Yoga balance pose', exercise_type: 'Balance' },
  { name: 'Heel-to-Toe Walk', description: 'Dynamic balance exercise', exercise_type: 'Balance' },
  
  // Plyometric exercises
  { name: 'Box Jumps', description: 'Explosive jumping exercise', exercise_type: 'Plyometric' },
  { name: 'Jump Squats', description: 'Explosive squat variation', exercise_type: 'Plyometric' },
  { name: 'Clap Push-ups', description: 'Explosive push-up variation', exercise_type: 'Plyometric' }
]

const units = [
  { name: 'reps', description: 'Repetitions' },
  { name: 'seconds', description: 'Time in seconds' },
  { name: 'minutes', description: 'Time in minutes' },
  { name: 'meters', description: 'Distance in meters' },
  { name: 'kilometers', description: 'Distance in kilometers' },
  { name: 'pounds', description: 'Weight in pounds' },
  { name: 'kilograms', description: 'Weight in kilograms' }
]

const exercisePresetGroups = [
  {
    name: 'Morning Strength Routine',
    description: 'A comprehensive strength training workout to start your day',
    is_active: true
  },
  {
    name: 'Cardio Blast',
    description: 'High-intensity cardio workout for fat burning',
    is_active: true
  },
  {
    name: 'Flexibility Flow',
    description: 'Gentle stretching and mobility routine',
    is_active: true
  },
  {
    name: 'Full Body HIIT',
    description: 'High-intensity interval training for total body conditioning',
    is_active: true
  },
  {
    name: 'Upper Body Focus',
    description: 'Targeted upper body strength training',
    is_active: true
  },
  {
    name: 'Lower Body Power',
    description: 'Explosive lower body training',
    is_active: true
  },
  {
    name: 'Core Strength',
    description: 'Abdominal and core muscle training',
    is_active: true
  },
  {
    name: 'Recovery Session',
    description: 'Light movement and stretching for recovery',
    is_active: true
  }
]

// Helper function to get random item from array
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

// Helper function to get random items from array
function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

// Helper function to get random date within range
function getRandomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return date.toISOString()
}

async function seedData() {
  console.log('🌱 Starting workout data seeding...')

  try {
    // 1. Seed exercise types
    console.log('📝 Seeding exercise types...')
    const { data: exerciseTypesData, error: exerciseTypesError } = await supabase
      .from('exercise_types')
      .upsert(exerciseTypes, { onConflict: 'name' })
      .select()

    if (exerciseTypesError) {
      console.error('Error seeding exercise types:', exerciseTypesError)
      return
    }

    console.log(`✅ Seeded ${exerciseTypesData?.length || 0} exercise types`)

    // 2. Seed units
    console.log('📝 Seeding units...')
    const { data: unitsData, error: unitsError } = await supabase
      .from('units')
      .upsert(units, { onConflict: 'name' })
      .select()

    if (unitsError) {
      console.error('Error seeding units:', unitsError)
      return
    }

    console.log(`✅ Seeded ${unitsData?.length || 0} units`)

    // 3. Seed exercises
    console.log('📝 Seeding exercises...')
    const { data: exercisesData, error: exercisesError } = await supabase
      .from('exercises')
      .upsert(exercises, { onConflict: 'name' })
      .select()

    if (exercisesError) {
      console.error('Error seeding exercises:', exercisesError)
      return
    }

    console.log(`✅ Seeded ${exercisesData?.length || 0} exercises`)

    // 4. Seed exercise preset groups
    console.log('📝 Seeding exercise preset groups...')
    const { data: presetGroupsData, error: presetGroupsError } = await supabase
      .from('exercise_preset_groups')
      .upsert(exercisePresetGroups, { onConflict: 'name' })
      .select()

    if (presetGroupsError) {
      console.error('Error seeding exercise preset groups:', presetGroupsError)
      return
    }

    console.log(`✅ Seeded ${presetGroupsData?.length || 0} exercise preset groups`)

    // 5. Create exercise presets for each group
    console.log('📝 Creating exercise presets...')
    const exercisePresets = []
    
    for (const group of presetGroupsData || []) {
      const groupExercises = getRandomItems(exercisesData || [], Math.floor(Math.random() * 5) + 3) // 3-7 exercises per group
      
      for (let i = 0; i < groupExercises.length; i++) {
        const exercise = groupExercises[i]
        const exerciseType = exerciseTypesData?.find(et => et.name === exercise.exercise_type)
        
        if (exerciseType) {
          exercisePresets.push({
            exercise_preset_group_id: group.id,
            exercise_id: exercise.id,
            order_index: i + 1,
            duration_minutes: Math.floor(Math.random() * 20) + 5, // 5-25 minutes
            notes: `Focus on proper form for ${exercise.name}`
          })
        }
      }
    }

    const { data: presetsData, error: presetsError } = await supabase
      .from('exercise_presets')
      .upsert(exercisePresets, { onConflict: 'exercise_preset_group_id,exercise_id' })
      .select()

    if (presetsError) {
      console.error('Error seeding exercise presets:', presetsError)
      return
    }

    console.log(`✅ Seeded ${presetsData?.length || 0} exercise presets`)

    // 6. Create exercise preset details (sets, reps, etc.)
    console.log('📝 Creating exercise preset details...')
    const presetDetails = []
    
    for (const preset of presetsData || []) {
      const sets = Math.floor(Math.random() * 3) + 2 // 2-4 sets
      const reps = Math.floor(Math.random() * 10) + 5 // 5-14 reps
      const restTime = Math.floor(Math.random() * 120) + 30 // 30-150 seconds
      
      for (let set = 1; set <= sets; set++) {
        presetDetails.push({
          exercise_preset_id: preset.id,
          set_index: set,
          reps: reps + Math.floor(Math.random() * 5) - 2, // Variation in reps
          weight: Math.floor(Math.random() * 50) + 10, // 10-60 weight
          rest_time: restTime,
          notes: set === 1 ? 'Warm-up set' : set === sets ? 'Final set - give it your all!' : undefined
        })
      }
    }

    const { data: detailsData, error: detailsError } = await supabase
      .from('exercise_preset_details')
      .upsert(presetDetails, { onConflict: 'exercise_preset_id,set_index' })
      .select()

    if (detailsError) {
      console.error('Error seeding exercise preset details:', detailsError)
      return
    }

    console.log(`✅ Seeded ${detailsData?.length || 0} exercise preset details`)

    // 7. Create training sessions with different statuses
    console.log('📝 Creating training sessions...')
    const trainingSessions = []
    const now = new Date()
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

    const sessionStatuses = ['assigned', 'ongoing', 'completed', 'cancelled']
    
    for (let i = 0; i < 20; i++) {
      const group = getRandomItem(presetGroupsData || [])
      const status = getRandomItem(sessionStatuses)
      const dateTime = getRandomDate(startDate, endDate)
      
      trainingSessions.push({
        exercise_preset_group_id: group.id,
        session_status: status,
        date_time: dateTime,
        week: Math.floor(Math.random() * 12) + 1, // Week 1-12
        day: Math.floor(Math.random() * 7) + 1, // Day 1-7
        notes: status === 'completed' ? 'Great workout! Felt strong today.' : 
               status === 'ongoing' ? 'Currently in progress...' :
               status === 'cancelled' ? 'Had to cancel due to injury' :
               'Ready to start this workout',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }

    const { data: sessionsData, error: sessionsError } = await supabase
      .from('exercise_training_sessions')
      .upsert(trainingSessions, { onConflict: 'id' })
      .select()

    if (sessionsError) {
      console.error('Error seeding training sessions:', sessionsError)
      return
    }

    console.log(`✅ Seeded ${sessionsData?.length || 0} training sessions`)

    // 8. Create some performance data for completed sessions
    console.log('📝 Creating performance data...')
    const performanceData = []
    
    const completedSessions = sessionsData?.filter(s => s.session_status === 'completed') || []
    
    for (const session of completedSessions.slice(0, 10)) { // Only for first 10 completed sessions
      const group = presetGroupsData?.find(g => g.id === session.exercise_preset_group_id)
      if (group) {
        const presets = presetsData?.filter(p => p.exercise_preset_group_id === group.id) || []
        
        for (const preset of presets) {
          const details = detailsData?.filter(d => d.exercise_preset_id === preset.id) || []
          
          for (const detail of details) {
            performanceData.push({
              exercise_training_session_id: session.id,
              exercise_preset_detail_id: detail.id,
              reps_completed: detail.reps + Math.floor(Math.random() * 3) - 1, // Slight variation
              weight_used: detail.weight + Math.floor(Math.random() * 10) - 5, // Slight variation
              rest_time_actual: detail.rest_time + Math.floor(Math.random() * 60) - 30, // Slight variation
              notes: 'Completed with good form',
              created_at: new Date().toISOString()
            })
          }
        }
      }
    }

    if (performanceData.length > 0) {
      const { data: perfData, error: perfError } = await supabase
        .from('exercise_training_details')
        .upsert(performanceData, { onConflict: 'exercise_training_session_id,exercise_preset_detail_id' })
        .select()

      if (perfError) {
        console.error('Error seeding performance data:', perfError)
        return
      }

      console.log(`✅ Seeded ${perfData?.length || 0} performance records`)
    }

    console.log('🎉 Workout data seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`- Exercise Types: ${exerciseTypesData?.length || 0}`)
    console.log(`- Units: ${unitsData?.length || 0}`)
    console.log(`- Exercises: ${exercisesData?.length || 0}`)
    console.log(`- Exercise Preset Groups: ${presetGroupsData?.length || 0}`)
    console.log(`- Exercise Presets: ${presetsData?.length || 0}`)
    console.log(`- Exercise Preset Details: ${detailsData?.length || 0}`)
    console.log(`- Training Sessions: ${sessionsData?.length || 0}`)
    console.log(`- Performance Records: ${performanceData.length}`)
    
    console.log('\n🚀 You can now test the workout features with realistic data!')

  } catch (error) {
    console.error('❌ Error during seeding:', error)
    process.exit(1)
  }
}

// Run the seeding
if (require.main === module) {
  seedData()
}

export { seedData }
