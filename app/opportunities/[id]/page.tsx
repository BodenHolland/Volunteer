import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ListChecks, CheckCircle2, ExternalLink, ShieldCheck } from "lucide-react";

const TASK_IMAGES: Record<string, string> = {
  task_trees:     "/tasks/trees.jpg",
  task_hazards:   "/tasks/hazards.jpg",
  task_translate: "/tasks/translate.jpg",
  task_input:     "/tasks/civic-input.jpg",
  task_seminar:   "/tasks/seminar.jpg",
  task_space:     "/tasks/community-space.jpg",
  task_food_audit: "/food-audit-icon.jpg",
  task_gov_audit:  "/gov-audit-icon.png",
  task_ems_rates:  "/ems-rates-icon.ico",
  task_zooniverse: "/zooniverse-icon.png",
  ext_audubon_count:   "/orgs/national-audubon-society.svg",
  ext_audubon_habitat: "/orgs/national-audubon-society.svg",
  ext_bbbs_mentor:     "/orgs/big-brothers-big-sisters.png",
  ext_feeding_pantry:  "/orgs/feeding-america.svg",
  ext_feeding_sort:    "/orgs/feeding-america.svg",
  ext_habitat_build:   "/orgs/habitat-for-humanity.svg",
  ext_habitat_restore: "/orgs/habitat-for-humanity.svg",
  ext_humane_foster:   "/orgs/humane-society.svg",
  ext_humane_shelter:  "/orgs/humane-society.svg",
  ext_mow_deliver:     "/orgs/meals-on-wheels-america.svg",
  ext_pro_esl:         "/orgs/proliteracy.svg",
  ext_pro_tutor:       "/orgs/proliteracy.svg",
  ext_redcross_blood:  "/orgs/american-red-cross.svg",
  ext_redcross_disaster: "/orgs/american-red-cross.svg",
  ext_sierra_trail:    "/orgs/sierra-club-foundation.png",
  ext_sierra_water:    "/orgs/sierra-club-foundation.png",
  ext_twb_translate:   "/orgs/translators-without-borders.png",
};
import { getTask } from "@/lib/queries";
import { commitToTask } from "@/app/app/project-actions";
import { Markdown } from "@/components/markdown";
import { OrgThumb } from "@/components/org-thumb";
import { Button } from "@/components/ui/button";
import { HeadlineTag, SecondaryTag, DeviceTag, LOCATION_LABEL, CATEGORY_LABEL } from "@/components/ui/tag";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { parseJson, type ChecklistItem } from "@/lib/types";
import { getDict } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/session";
import { ZOONIVERSE_TASK_DETAIL_DISCLAIMER, ZOONIVERSE_HOMEPAGE_URL } from "@/lib/zooniverse";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await getTask(id);
  return { title: task ? `${task.title}, colift` : "Opportunity | colift" };
}

export default async function PublicTaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await getTask(id);
  if (!task) notFound();

  const checklist = parseJson<ChecklistItem[]>(task.checklist_json, []);
  const { locale, t } = await getDict();
  const viewer = await getCurrentUser();
  const nextUrl = encodeURIComponent(`/opportunities/${task.id}`);
  const isExternalCert = task.evidence_mode === "external_certificate";

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-6 md:py-14">
          <Link href="/opportunities" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:underline">
            <ArrowLeft className="size-4" /> {t.opportunitiesDetail.allTasks}
          </Link>

          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="min-w-0">
              <div className="flex items-start gap-4">
                {TASK_IMAGES[task.id] ? (
                  <span className="flex h-[72px] w-[72px] shrink-0 rounded-md overflow-hidden border border-line">
                    <Image src={TASK_IMAGES[task.id]} alt="" width={72} height={72} className="h-full w-full object-cover" />
                  </span>
                ) : (
                  <OrgThumb name={task.org.name} slug={task.org.slug} logoUrl={task.org.logo_url} size={72} className="h-[72px] w-[72px]" />
                )}
                <div>
                  <h1 className="text-[28px] font-semibold leading-tight text-ink">{task.title}</h1>
                  <p className="mt-1 text-[15px] font-medium text-ink">{task.org.name}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <HeadlineTag>{LOCATION_LABEL[task.location_kind]}</HeadlineTag>
                <SecondaryTag>{CATEGORY_LABEL[task.category]}</SecondaryTag>
                <DeviceTag category={task.category} />
              </div>

              <section className="mt-8">
                <h2 className="mb-2 text-[22px] font-semibold text-ink">{t.opportunitiesDetail.aboutTask}</h2>
                <Markdown>{task.instructions_md}</Markdown>
              </section>

              {checklist.length > 0 && (
                <section className="mt-8">
                  <h2 className="mb-3 flex items-center gap-2 text-[22px] font-semibold text-ink">
                    <ListChecks className="size-5 text-forest" /> {t.opportunitiesDetail.whatYoullDo}
                  </h2>
                  <ul className="space-y-2">
                    {checklist.map((item) => (
                      <li key={item.id} className="flex items-start gap-2.5 text-body">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-forest" strokeWidth={1.5} />
                        <span>
                          {item.label}
                          {!item.required && <span className="ml-1.5 text-xs text-meta">{t.opportunitiesDetail.optional}</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            <aside className="lg:sticky lg:top-20 lg:self-start">
              {isExternalCert ? (
                <div className="rounded-lg border border-line bg-white p-5 space-y-4">
                  <p className="rounded-md bg-amber-subtle p-3 text-xs text-body">
                    <ShieldCheck className="mr-1 inline size-3.5 align-text-bottom text-amber" />
                    {ZOONIVERSE_TASK_DETAIL_DISCLAIMER}
                  </p>
                  <a
                    href={ZOONIVERSE_HOMEPAGE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-1.5 rounded-md bg-forest px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest/90 transition-colors"
                  >
                    <ExternalLink className="size-4" /> Open Zooniverse
                  </a>
                  {viewer ? (
                    <form action={commitToTask}>
                      <input type="hidden" name="task_id" value={task.id} />
                      <Button type="submit" variant="secondary" className="w-full">
                        Return with certificate
                      </Button>
                    </form>
                  ) : (
                    <div className="space-y-2">
                      <Button asChild variant="secondary" className="w-full">
                        <Link href={`/login?next=${nextUrl}`}>Sign in to upload certificate</Link>
                      </Button>
                      <Button asChild variant="secondary" className="w-full">
                        <Link href={`/start?next=${nextUrl}`}>Sign up</Link>
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-meta">
                    {task.monthly_minutes_cap != null
                      ? `Hours are credited from the certificate, up to ${Math.round(task.monthly_minutes_cap / 60)} per month per Zooniverse project.`
                      : "Hours are credited from the certificate, whatever Zooniverse recorded."}
                  </p>
                </div>
              ) : task.listing_type === "external" ? (
                <div className="rounded-lg border border-line bg-white p-5 space-y-4">
                  <p className="rounded-md bg-section p-3 text-xs text-body">
                    This opportunity is organized by <strong>{task.org.name}</strong>. Sign up directly on their website.
                  </p>
                  <a
                    href={task.external_url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center rounded-md bg-forest px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest/90 transition-colors"
                  >
                    Sign up at {task.org.name} →
                  </a>
                </div>
              ) : (
                <div className="rounded-lg border border-line bg-white p-5">
                  <p className="rounded-md bg-section p-3 text-xs text-body">
                    {t.opportunitiesDetail.sidebarNote}
                  </p>
                  {viewer ? (
                    <form action={commitToTask} className="mt-4">
                      <input type="hidden" name="task_id" value={task.id} />
                      <Button type="submit" className="w-full">{t.opportunitiesDetail.commit}</Button>
                    </form>
                  ) : (
                    <div className="mt-4 space-y-2">
                      <Button asChild className="w-full">
                        <Link href={`/login?next=${nextUrl}`}>{t.opportunitiesDetail.signInToCommit}</Link>
                      </Button>
                      <Button asChild variant="secondary" className="w-full">
                        <Link href={`/start?next=${nextUrl}`}>{t.opportunitiesDetail.signUp}</Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
