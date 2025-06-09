import ClientAthleteDetail from './client'
 
export default function AthleteDetailPage({ params }) {
  return <ClientAthleteDetail athleteId={params.id} />
} 