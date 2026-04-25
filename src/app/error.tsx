'use client' // Error boundaries must be Client Components

export default function Error({
                                  error,
                                  unstable_retry,
                              }: {
    error: Error & { digest?: string }
    unstable_retry: () => void
}) {
    return (
        <div>
            <h2>Something went wrong!</h2>
            <button onClick={() => unstable_retry()}>Try again</button>
        </div>
    )
}