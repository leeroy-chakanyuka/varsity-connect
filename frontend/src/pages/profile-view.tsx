import type { Profile } from "../api/profile";

/* shared profile card, both own and public pages read the same way */
export function ProfileView({ profile }: { profile: Profile }) {
  const initials = profile.fullName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <article className="rounded-2xl border border-sage/70 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        {/* image placeholder until the upload stage wires real photos */}
        <div
          aria-hidden="true"
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blush/50 font-display text-xl font-semibold lowercase text-cocoa"
        >
          {initials}
        </div>
        <div>
          <h2 className="font-display text-2xl font-semibold lowercase text-cocoa">
            {profile.fullName}
          </h2>
          <p className="mt-0.5 inline-block rounded-full bg-blush/40 px-2.5 py-0.5 text-xs lowercase text-cocoa">
            {profile.role.toLowerCase()}
          </p>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="lowercase text-taupe">email</dt>
          <dd className="text-cocoa">{profile.email}</dd>
        </div>
        {profile.studentNumber && (
          <div>
            <dt className="lowercase text-taupe">student number</dt>
            <dd className="text-cocoa">{profile.studentNumber}</dd>
          </div>
        )}
        {profile.faculty && (
          <div>
            <dt className="lowercase text-taupe">faculty</dt>
            <dd className="lowercase text-cocoa">{profile.faculty}</dd>
          </div>
        )}
        {profile.phoneNumber && (
          <div>
            <dt className="lowercase text-taupe">phone</dt>
            <dd className="text-cocoa">{profile.phoneNumber}</dd>
          </div>
        )}
      </dl>

      {profile.bio && <p className="mt-4 text-sm text-cocoa">{profile.bio}</p>}

      <div className="mt-4 border-t border-sage/60 pt-3">
        {profile.reviewCount === 0 ? (
          <p className="text-xs lowercase text-taupe">no reviews yet</p>
        ) : (
          <p className="text-xs lowercase text-taupe">
            {profile.averageRating.toFixed(1)} from {profile.reviewCount}{" "}
            {profile.reviewCount === 1 ? "review" : "reviews"}
          </p>
        )}
      </div>
    </article>
  );
}
