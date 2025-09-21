import React from 'react';
import Image from 'next/image';

type ProfileCardProps = {
  user?: {
    avatar: string;
    name: string;
    title: string;
  };
};

export default function ProfileCard({
  user = {
    avatar:
      '/employees/CEO.jpg',
    name: 'Ali',
    title: 'CEO@synctom',
  },
}: ProfileCardProps) {
  return (
    <div className="relative h-full rounded-3xl overflow-hidden shadow-2xl bg-white">
      {/* Background Image */}
      <Image
        src={user.avatar}
        alt={user.name}
        fill
        className="object-cover"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

      {/* Content Container */}
      <div className="absolute bottom-0 left-0 w-full">
        {/* Glassmorphism Background */}
        <div className="relative backdrop-blur-xs bg-white/10 rounded-2xl p-4 border-white/20 shadow-lg">
          {/* Main Content */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-white text-xl">{user.name}</h3>
              <p className="text-muted text-xs">{user.title}</p>
            </div>
          </div>

          {/* Subtle Inner Glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Outer Glow Effect */}
      <div className="absolute -inset-1 bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-3xl blur-sm -z-10" />
    </div>
  );
}
