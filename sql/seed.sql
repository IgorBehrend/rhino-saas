-- ============================================================
-- SEED DATA - Generated from Dados_Maquinas_RHINO.xlsx
-- Run AFTER schema.sql, and AFTER creating your first user
-- Replace 'YOUR-USER-UUID' with your actual user ID from Supabase auth
-- ============================================================

-- To get your user UUID: SELECT id FROM auth.users LIMIT 1;

do $$
declare v_user_id uuid := 'YOUR-USER-UUID'; -- ← REPLACE THIS
begin

-- ============================================================
-- MACHINES from "Estoque Prosyst" sheet
-- ============================================================
insert into public.machines (user_id, code, name, machine_type, status, qty_system, qty_physical, notes) values
(v_user_id, '4931-T', 'CNC LASER RMF 1530 METAL - 3000 W - COMPLETA', 'LASER', 'production', 2, 2, '1 em linha de produção já vendida / 1 retorno de feira'),
(v_user_id, '4008-T', 'CNC LASER RML 1310 - 130 W', 'LASER', 'available', 20, 17, '1 em linha de produção já vendida / 3 embaladas'),
(v_user_id, '4009-T', 'CNC LASER RML 1310 - 150 W', 'LASER', 'available', 4, 2, '1 aguardando tudo CO2 150w'),
(v_user_id, '4010-T', 'CNC LASER RML 9060 - 130 W', 'LASER', 'maintenance', 5, 5, '1 sucateada / 1 com peças avariadas'),
(v_user_id, '4344-T', 'COLADEIRA DE BORDA RCB5G', 'COLADEIRA', 'available', 1, 1, 'Aguardando montagem'),
(v_user_id, '4345-T', 'COLADEIRA DE BORDA RCB6G', 'COLADEIRA', 'sold', 1, 0, 'Não temos em estoque'),
(v_user_id, '4346-T', 'COLADEIRA DE BORDA RCB7G', 'COLADEIRA', 'available', 3, 3, 'Aguardando montagem'),
(v_user_id, 'R4015-T', 'DOBRADEIRA LETRA CAIXA 20 x 125 MM A130 - IMP', 'DOBRADEIRA', 'maintenance', 2, 1, '1 Folga no redutor planetário, em manutenção'),
(v_user_id, 'R5264-T', 'MAQUINA LASER CO2 MODELO RML 1325-180W S/ CCD-CLL-CPS-220V-M-IMP', 'LASER', 'sold', 1, 0, 'Todas 1325 foram vendidas'),
(v_user_id, 'R5265-T', 'MAQUINA LASER CO2 MODELO RML 1610-100W S/ CCD-MAA-CLL-CPS-220V-M-IMP', 'LASER', 'maintenance', 1, 1, 'Em restauração, componentes oxidados'),
(v_user_id, 'R4054-T', 'MAQUINA MESA CORTE CNC MODELO RHINOCUT 1625 2H-CCD-2.VB.10CV-380V-T', 'ROUTER', 'production', 4, 5, '1 em linha de produção já vendida'),
(v_user_id, '6279-T', 'MAQUINA ROUTER CNC RMC 3000 1S EXPERT START SUC 380V-T', 'ROUTER', 'available', 4, 4, '3 embaladas a pronta entrega'),
(v_user_id, '6268-T', 'MAQUINA ROUTER CNC RMC 3000 1S PLUS PRO FIX IMP', 'ROUTER', 'available', 5, 5, '1 Embalada a pronta entrega'),
(v_user_id, '5306-T', 'MAQUINA ROUTER CNC RMC 3000 ABS IMP SUC380V-E SV', 'ROUTER', 'sold', 5, 0, 'Apenas 1 na planta, porém ja vendida'),
(v_user_id, '6269-T', 'MAQUINA ROUTER CNC RMC 3000 1S PLUS PRO FIX SUC380V IMP', 'ROUTER', 'available', 12, 12, '4 embaladas a pronta entrega'),
(v_user_id, '6350-T', 'MAQUINA ROUTER CNC RMC 3000ABS IMP SUC-ES2000x3000', 'ROUTER', 'sold', 1, 0, 'Todas vendidas'),
(v_user_id, '6277-T', 'MAQUINA ROUTER CNC RMC 5000 2S ABS IMP SUC380-E SERVO', 'ROUTER', 'sold', 1, 0, 'Todas vendidas'),
(v_user_id, '6294-T', 'MAQUINA ROUTER CNC RMC 5000 2S ABSOLUTE IMP SEM SUCCAO', 'ROUTER', 'production', 1, 1, '1 em linha de produção'),
(v_user_id, '6270-T', 'MAQUINA ROUTER CNC RMC 5000 2S PLUS PRO VA IMP', 'ROUTER', 'available', 9, 9, '1 retorno de feira'),
(v_user_id, '6271-T', 'MAQUINA ROUTER CNC RMC 5000 2S PLUS PRO VA SUC380V IMP', 'ROUTER', 'production', 5, 3, '1 em linha de produção já vendida'),
(v_user_id, '6321-T', 'MAQUINA ROUTER CNC RMC 5500 2S ABSOLUTE ATC EASY SERVO', 'ROUTER', 'sold', 2, 0, 'Todas vendidas'),
(v_user_id, 'R4004-T', 'MAQUINA SOLDA LASER RHINO MODELO RMS 1500W 3 EM 1 220V-M-IMP', 'LASER', 'available', 1, 1, '1 Troca, retornou ao estoque'),
(v_user_id, '4014-T', 'SOLDA LASER LETRA CAIXA 300W 910X1320MM', 'LASER', 'maintenance', 2, 3, '1 Defeito no Crisal, aguardando reposição'),
(v_user_id, '4005-T', 'CNC LASER RMF 1530 METAL - 1500 W - COMPLETA', 'LASER', 'production', 0, 2, '1 em linha de produção já vendida'),
(v_user_id, '4011-T', 'FIBER LASER 30W 200X200MM', 'LASER', 'maintenance', 0, 1, '1 Defeito no Software'),
(v_user_id, 'R5109-T', 'MAQUINA LASER CO2 MODELO RML 1325-180W C/ CCD-CLL-CPS-220V-M-IMP', 'LASER', 'sold', 0, 0, 'Todas vendidas');

-- ============================================================
-- TECHNICAL SPECS from "Dimensões e Dados" sheet
-- ============================================================
insert into public.specs (machine_id, vol1_length, vol1_width, vol1_height, vol1_weight, vol2_length, vol2_width, vol2_height, voltage)
select m.id, 310, 215, 130, null, null, null, null, '220V'
from public.machines m where m.code = 'R5265-T' and m.user_id = v_user_id;

insert into public.specs (machine_id, vol1_length, vol1_width, vol1_height, vol1_weight, voltage)
select m.id, 190, 105, 770, null, '220V'
from public.machines m where m.code = '4014-T' and m.user_id = v_user_id;

insert into public.specs (machine_id, vol1_length, vol1_width, vol1_height, vol1_weight, vol2_length, vol2_width, vol2_height, voltage)
select m.id, 200, 150, 90, 480, null, null, null, '380V'
from public.machines m where m.code = '6279-T' and m.user_id = v_user_id;

insert into public.specs (machine_id, vol1_length, vol1_width, vol1_height, vol1_weight, voltage)
select m.id, 280, 85, 130, 800, '380V'
from public.machines m where m.code = '6350-T' and m.user_id = v_user_id;

end $$;
