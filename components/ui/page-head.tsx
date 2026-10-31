export function PageHead({
  title,
  intro,
  aside,
}: {
  title: React.ReactNode;
  intro?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="head">
      <div>
        <h1 className="sv-h1">{title}</h1>
        {intro && <p className="sv-body">{intro}</p>}
      </div>
      {aside && <div>{aside}</div>}
    </div>
  );
}
