interface UserAvatarProps {
  photoURL: string | null | undefined
  displayName: string | null | undefined
  email?: string | null | undefined
  size: number
  alt?: string
  className?: string
  fallbackClassName?: string
}

export function UserAvatar({
  photoURL,
  displayName,
  email,
  size,
  alt,
  className,
  fallbackClassName,
}: UserAvatarProps) {
  if (photoURL) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoURL}
        alt={alt ?? displayName ?? 'User avatar'}
        className={className}
        width={size}
        height={size}
      />
    )
  }

  return (
    <span className={fallbackClassName}>
      {(displayName ?? email ?? 'U')[0].toUpperCase()}
    </span>
  )
}
