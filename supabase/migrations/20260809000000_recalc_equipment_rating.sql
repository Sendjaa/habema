-- =====================================================================
-- Habema — Hitung ulang equipment.average_rating dari tabel reviews
-- =====================================================================
-- Kolom average_rating di tabel equipment sebelumnya bersifat statis dan
-- tidak pernah diperbarui saat review ditambahkan. Trigger ini otomatis
-- menghitung ulang rata-rata (avg) rating dari tabel reviews setiap ada
-- baris reviews yang di-insert, di-update, atau dihapus.
--
-- Baris balasan (reply) di tabel reviews disimpan dengan prefiks "@nama:"
-- dan rating 5, sehingga DICULKAN dari perhitungan agar tidak merusak
-- rata-rata (konsisten dengan filter di halaman ulasan).
-- =====================================================================

create or replace function public.recalc_equipment_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  eq_id uuid;
begin
  eq_id := coalesce(new.equipment_id, old.equipment_id);

  if eq_id is not null then
    update public.equipment e
      set average_rating = coalesce(
        (select avg(r.rating)::numeric(3,2)
         from public.reviews r
         where r.equipment_id = eq_id
           and r.comment is not null
           and r.comment not like '@%'),
        0
      )
    where e.id = eq_id;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_recalc_equipment_rating on public.reviews;

create trigger trg_recalc_equipment_rating
  after insert or update or delete on public.reviews
  for each row
  execute function public.recalc_equipment_rating();
