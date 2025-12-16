"use client";
import Image from "next/image";
import React, { useState } from "react";
import { getAvatarUrl, AvatarStyle } from "@/lib/avatar";

interface UserAvatarProps {
  src?: string | null;
  seed: string; // Email ou userId pour générer un avatar consistant
  alt?: string;
  size?: "xsmall" | "small" | "medium" | "large" | "xlarge" | "xxlarge";
  status?: "online" | "offline" | "busy" | "none";
  avatarStyle?: AvatarStyle;
  className?: string;
}

const sizeClasses = {
  xsmall: "h-6 w-6",
  small: "h-8 w-8",
  medium: "h-10 w-10",
  large: "h-12 w-12",
  xlarge: "h-14 w-14",
  xxlarge: "h-16 w-16",
};

const pixelSizes = {
  xsmall: 24,
  small: 32,
  medium: 40,
  large: 48,
  xlarge: 56,
  xxlarge: 64,
};

const statusSizeClasses = {
  xsmall: "h-1.5 w-1.5",
  small: "h-2 w-2",
  medium: "h-2.5 w-2.5",
  large: "h-3 w-3",
  xlarge: "h-3.5 w-3.5",
  xxlarge: "h-4 w-4",
};

const statusColorClasses = {
  online: "bg-success-500",
  offline: "bg-error-400",
  busy: "bg-warning-500",
};

const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  seed,
  alt = "Avatar utilisateur",
  size = "medium",
  status = "none",
  avatarStyle = "lorelei",
  className = "",
}) => {
  const [imageError, setImageError] = useState(false);

  // Utiliser l'avatar généré si pas d'image ou si erreur de chargement
  const avatarSrc = (!src || imageError)
    ? getAvatarUrl(seed, avatarStyle, pixelSizes[size] * 2) // x2 pour retina
    : src;

  return (
    <div className={`relative rounded-full overflow-hidden ${sizeClasses[size]} ${className}`}>
      <Image
        src={avatarSrc}
        alt={alt}
        fill
        className="object-cover"
        onError={() => setImageError(true)}
        unoptimized={!src || imageError} // SVG externes n'ont pas besoin d'optimisation
      />

      {status !== "none" && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-[1.5px] border-white dark:border-gray-900 ${statusSizeClasses[size]} ${statusColorClasses[status] || ""}`}
        />
      )}
    </div>
  );
};

export default UserAvatar;
