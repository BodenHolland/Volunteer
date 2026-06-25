import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata = { title: "How to complete and submit your work | Help Center" };

export default async function Page() {
  const { locale, t } = await getDict();
  const { prev, next } = neighbors(15, locale);
  const c = t.helpCompleteWork;

  return (
    <ArticleShell number={15} title={c.title} prev={prev} next={next}>
      <p>
        {c.intro.split("/app/projects/[id]")[0]}
        <code>/app/projects/[id]</code>
        {c.intro.split("/app/projects/[id]")[1]}
      </p>

      <h2>{c.s1Heading}</h2>
      <p>{c.s1Body}</p>

      <h2>{c.s2Heading}</h2>
      <p>{c.s2Body}</p>
      <ul>
        <li><strong>{c.s2RequiredLabel}</strong>: {c.s2RequiredBody}</li>
        <li><strong>{c.s2OptionalLabel}</strong>: {c.s2OptionalBody}</li>
      </ul>
      <p>{c.s2Footer}</p>

      <h2>{c.s3Heading}</h2>
      <p>{c.s3Body}</p>

      <h2>{c.s4Heading}</h2>
      <p>
        {c.s4Body.split(c.startSession)[0]}
        <strong>{c.startSession}</strong>
        {c.s4Body.split(c.startSession)[1].split(c.stopSession)[0]}
        <strong>{c.stopSession}</strong>
        {c.s4Body.split(c.stopSession)[1]}
      </p>
      <ol>
        <li>
          {c.s4Step0.split(c.startSession)[0]}
          <strong>{c.startSession}</strong>
          {c.s4Step0.split(c.startSession)[1]}
        </li>
        <li>{c.s4Step1}</li>
        <li>
          {c.s4Step2.split(c.stopSession)[0]}
          <strong>{c.stopSession}</strong>
          {c.s4Step2.split(c.stopSession)[1]}
        </li>
        <li>{c.s4Step3}</li>
      </ol>
      <p>{c.s4Footer}</p>

      <h2>{c.s5Heading}</h2>
      <p>
        {c.s5Body.split(c.submitWhenReady)[0]}
        <strong>{c.submitWhenReady}</strong>
        {c.s5Body.split(c.submitWhenReady)[1]}
      </p>
      <ul>
        <li>{c.s5Item0}</li>
        <li>{c.s5Item1}</li>
      </ul>

      <h2>{c.s6Heading}</h2>
      <ol>
        <li>
          {c.s6Step0.split(c.submitWhenReady)[0]}
          <strong>{c.submitWhenReady}</strong>
          {c.s6Step0.split(c.submitWhenReady)[1].split("/app/projects/[id]/submit")[0]}
          <code>/app/projects/[id]/submit</code>
          {c.s6Step0.split("/app/projects/[id]/submit")[1]}
        </li>
        <li>{c.s6Step1}</li>
        <li>
          {c.s6Step2.split(c.statusSubmitted)[0]}
          <em>{c.statusSubmitted}</em>
          {c.s6Step2.split(c.statusSubmitted)[1].split(c.statusAiReviewing)[0]}
          <em>{c.statusAiReviewing}</em>
          {c.s6Step2.split(c.statusAiReviewing)[1]}
        </li>
      </ol>

      <h2>{c.s7Heading}</h2>
      <p>{c.s7Body}</p>
      <ul>
        <li><strong>{c.s7PendingLabel}</strong>: {c.s7PendingBody}</li>
        <li><strong>{c.s7NeedsChangesLabel}</strong>: {c.s7NeedsChangesBody}</li>
        <li><strong>{c.s7RejectedLabel}</strong>: {c.s7RejectedBody}</li>
      </ul>

      <h2>{c.s8Heading}</h2>
      <p>
        {c.s8Body.split(c.statusNeedsChanges)[0]}
        <em>{c.statusNeedsChanges}</em>
        {c.s8Body.split(c.statusNeedsChanges)[1]}
      </p>

      <hr />
      <p>
        <em>{c.seeAlsoLabel}</em>{" "}
        <a href="/help/14-find-a-task">{c.seeAlsoFindTask}</a>
        {" · "}
        <a href="/help/16-hours-cf888">{c.seeAlsoCf888}</a>
      </p>
    </ArticleShell>
  );
}
