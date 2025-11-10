import { useLoading } from '../context/LoadingContext'
import LoadingSpinner from './LoadingSpinner'

export default function GlobalLoading() {
  const { isLoading, loadingMessage } = useLoading()

  if (!isLoading) return null

  return <LoadingSpinner overlay message={loadingMessage} size="lg" />
}
