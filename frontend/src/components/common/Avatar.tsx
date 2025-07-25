export default function CustomAvatar({ src, name, size = "w-10 h-10" }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || "User Avatar"}
        className={`${size} rounded-full object-cover`}
        referrerPolicy="no-referrer"
      />
    );
  }

  const initial = name ? name.charAt(0).toUpperCase() : "?";
  return (
    <div
      className={`${size} flex items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white`}
    >
      {initial}
    </div>
  );
}
