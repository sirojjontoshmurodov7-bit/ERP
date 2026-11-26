'use client';
import { useT } from '@/lib/i18n';
import { useState } from 'react';
import { Icon } from '@/components/icons';
import { Button, Confirm, DataView, Dialog, Empty, MoneyInput, PageHead, SelectInput, Skeleton, Tag, TextInput, whenOpen } from '@/components/ui';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import { useSubmit } from '@/lib/forms';
import type { Course } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';

export function CoursesPage() {
  const t = useT();
  const { can } = useSession();
  const [archived, setArchived] = useState('false');
  const list = useApi<{ items: Course[] }>('/courses', { includeArchived: archived });
  const [edit, setEdit] = useState<Course | 'new' | null>(null);
  const [toggle, setToggle] = useState<Course | null>(null);
  const manage = can('group.create');
  return (
    <>
      <PageHead
        title="Kurslar"
        sub="Kurs guruhlar uchun yo'nalish va sukut narxi."
        actions={manage ? <Button variant="primary" icon={<Icon.plus />} onClick={() => setEdit('new')}>{t("Yangi kurs")}</Button> : null}
      />
      <div className="toolbar">
        <SelectInput label="Arxiv" value={archived} onChange={(e) => setArchived(e.target.value)} options={[{ value: 'false', label: "Ko'rsatilmaydi" }, { value: 'true', label: "Ko'rsatiladi" }]} />
      </div>
      <div className="table-wrap">
        <DataView state={list} skeleton={<Skeleton rows={4} cols={3} />} empty={(d) => (d.items.length ? null : <Empty title="Kurs yo'q" text="Masalan: Ingliz tili, Matematika. Guruh yaratishda kurs tanlanadi." action={manage ? <Button size="sm" variant="primary" onClick={() => setEdit('new')}>{t("Yangi kurs")}</Button> : undefined} />)}>
          {(d) => (
            <table className="table">
              <thead>
                <tr>
                  <th>{t("Kurs")}</th>
                  <th className="num">{t("Sukut narx, so'm")}</th>
                  <th>{t("Holat")}</th>
                  {manage ? <th className="actions-cell" aria-label={t("Amallar")} /> : null}
                </tr>
              </thead>
              <tbody>
                {d.items.map((c) => (
                  <tr key={c.id}>
                    <td className="cell-main">{c.name}</td>
                    <td className="num">{c.defaultPrice !== null ? money(c.defaultPrice) : t("yo'q")}</td>
                    <td>{c.archivedAt ? <Tag kind="mute">{t("Arxivda")}</Tag> : <Tag kind="ok">{t("Faol")}</Tag>}</td>
                    {manage ? (
                      <td className="actions-cell">
                        <span className="row">
                          {!c.archivedAt ? (
                            <Button size="sm" variant="ghost" onClick={() => setEdit(c)}>
                              {t("Tahrirlash")}
                            </Button>
                          ) : null}
                          <Button size="sm" variant="ghost" onClick={() => setToggle(c)}>
                            {c.archivedAt ? 'Qaytarish' : 'Arxivlash'}
                          </Button>
                        </span>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </DataView>
      </div>
      <CourseDialog open={edit !== null} course={edit === 'new' ? null : edit} onClose={() => setEdit(null)} onSaved={list.reload} />
      <Confirm
        open={toggle !== null}
        onClose={() => setToggle(null)}
        title={toggle?.archivedAt ? 'Kursni qaytarish' : 'Kursni arxivlash'}
        text={toggle?.archivedAt ? 'Kurs yana yangi guruhlar uchun tanlanadi.' : "Arxivlangan kurs yangi guruhlar uchun tanlanmaydi. Mavjud guruhlar o'zgarmaydi."}
        confirmLabel={toggle?.archivedAt ? 'Qaytarish' : 'Arxivlash'}
        onConfirm={async () => {
          await api.post(`/courses/${toggle!.id}/${toggle!.archivedAt ? 'unarchive' : 'archive'}`);
          list.reload();
        }}
      />
    </>
  );
}

const CourseDialog = whenOpen(function CourseDialogInner({ open, course, onClose, onSaved }: { open: boolean; course: Course | null; onClose: () => void; onSaved: () => void }) {
  const t = useT();
  const [name, setName] = useState(course?.name ?? '');
  const [price, setPrice] = useState<number | ''>(course?.defaultPrice ?? '');
  const s = useSubmit();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = course ? { ...(name.trim() !== course.name ? { name: name.trim() } : {}), ...(price !== (course.defaultPrice ?? '') ? { defaultPrice: price === '' ? null : price } : {}) } : { name: name.trim(), ...(price !== '' ? { defaultPrice: price } : {}) };
    if (course && !Object.keys(body).length) return onClose();
    const r = await s.run(() => (course ? api.patch(`/courses/${course.id}`, body) : api.post('/courses', body)));
    if (r) {
      onSaved();
      onClose();
    }
  };
  return (
    <Dialog open={open} onClose={onClose} title={course ? 'Kursni tahrirlash' : 'Yangi kurs'} footer={<><Button onClick={onClose}>{t("Bekor qilish")}</Button><Button variant="primary" type="submit" form="course-form" busy={s.busy}>{t("Saqlash")}</Button></>}>
      <form id="course-form" className="form" onSubmit={submit} noValidate>
        <TextInput label="Nomi" value={name} onChange={(e) => setName(e.target.value)} error={s.fields.name} autoFocus />
        <MoneyInput label="Sukut oylik narx" optional value={price} onChange={setPrice} error={s.fields.defaultPrice} hint="Yangi guruh yaratishda taklif qilinadi" />
        {s.error ? <p className="form-error" role="alert">{s.error}</p> : null}
      </form>
    </Dialog>
  );
});
