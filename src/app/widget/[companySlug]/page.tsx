import type { Metadata } from "next";
import { fetchCompanyBySlug, fetchJobsForCompany } from "@/lib/supabase/queries";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const revalidate = 300;

export default async function WidgetPage(
  props: { params: Promise<{ companySlug: string }> },
) {
  const { companySlug } = await props.params;
  const company = await fetchCompanyBySlug(companySlug);
  if (!company) notFound();

  const jobs = await fetchJobsForCompany(company.id);

  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <style dangerouslySetInnerHTML={{ __html: WIDGET_CSS }} />
      </head>
      <body>
        <div className="murmc-widget">
          <div className="murmc-header">
            <span className="murmc-logo">{company.initials}</span>
            <div>
              <div className="murmc-company">{company.name}</div>
              <div className="murmc-count">{jobs.length} poste{jobs.length > 1 ? "s" : ""} ouvert{jobs.length > 1 ? "s" : ""}</div>
            </div>
          </div>

          {jobs.length === 0 ? (
            <div className="murmc-empty">Aucune offre ouverte pour le moment.</div>
          ) : (
            <ul className="murmc-list">
              {jobs.map((job) => (
                <li key={job.id}>
                  <a href={`https://montecarlowork.com/jobs/${job.slug}`} target="_blank" rel="noopener noreferrer" className="murmc-job">
                    <div className="murmc-job-title">{job.title}</div>
                    <div className="murmc-job-meta">
                      <span>{job.type}</span>
                      <span>{job.location}</span>
                      {job.remote !== "Sur site" && <span>{job.remote}</span>}
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}

          <a href={`https://montecarlowork.com/entreprises/${company.slug}`} target="_blank" rel="noopener noreferrer" className="murmc-footer">
            Propulse par Monte Carlo Work
          </a>
        </div>
      </body>
    </html>
  );
}

const WIDGET_CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: transparent; }
.murmc-widget { border: 1px solid #e5e4e0; border-radius: 16px; overflow: hidden; background: #fff; }
.murmc-header { display: flex; align-items: center; gap: 12px; padding: 20px; border-bottom: 1px solid #e5e4e0; }
.murmc-logo { width: 40px; height: 40px; border-radius: 12px; background: #1C3D5A; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; flex-shrink: 0; }
.murmc-company { font-size: 15px; font-weight: 600; color: #0a0a0a; }
.murmc-count { font-size: 12px; color: #888; margin-top: 2px; }
.murmc-list { list-style: none; }
.murmc-job { display: block; padding: 16px 20px; border-bottom: 1px solid #e5e4e0; text-decoration: none; color: inherit; transition: background 0.15s; }
.murmc-job:hover { background: #f9f9f8; }
.murmc-job:last-child { border-bottom: none; }
.murmc-job-title { font-size: 14px; font-weight: 600; color: #0a0a0a; line-height: 1.3; }
.murmc-job:hover .murmc-job-title { color: #1C3D5A; }
.murmc-job-meta { display: flex; gap: 8px; margin-top: 6px; font-size: 12px; color: #888; }
.murmc-job-meta span { display: inline-flex; align-items: center; }
.murmc-empty { padding: 32px 20px; text-align: center; color: #888; font-size: 13px; font-style: italic; }
.murmc-footer { display: block; padding: 12px; text-align: center; font-size: 11px; color: #aaa; text-decoration: none; border-top: 1px solid #e5e4e0; background: #fafaf9; }
.murmc-footer:hover { color: #1C3D5A; }
`;
