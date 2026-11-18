import {
  defaultRolePermissionRows,
  PERMISSION_CODES,
  PLATFORM_ONLY_PERMISSIONS,
  ROLE_PERMISSION_MATRIX,
  type TenantRole,
} from '@erp/shared';

describe('ROLE_PERMISSION_MATRIX izchilligi', () => {
  const roles = Object.keys(ROLE_PERMISSION_MATRIX) as TenantRole[];

  it("hamma kod mavjud ruxsatlar ro'yxatida va platforma-faqat kodlar shablonga tushmagan", () => {
    for (const role of roles) {
      for (const code of [...ROLE_PERMISSION_MATRIX[role].default, ...ROLE_PERMISSION_MATRIX[role].optional]) {
        expect(PERMISSION_CODES.has(code), `${role}: ${code}`).toBe(true);
        expect(PLATFORM_ONLY_PERMISSIONS.has(code), `${role}: ${code} platforma ruxsati`).toBe(false);
      }
    }
  });

  it('default va optional kesishmaydi, takrorlanmaydi', () => {
    for (const role of roles) {
      const all = [...ROLE_PERMISSION_MATRIX[role].default, ...ROLE_PERMISSION_MATRIX[role].optional];
      expect(new Set(all).size, role).toBe(all.length);
    }
  });

  it("qator ro'yxatida takror (role, kod) yo'q", () => {
    const keys = defaultRolePermissionRows().map((r) => `${r.role}:${r.permissionCode}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("matritsadagi tanlangan qoidalar: o'quvchi hech narsa yoza olmaydi, faqat ustoz vazifa yaratadi, rahbarda audit bor", () => {
    expect(ROLE_PERMISSION_MATRIX.STUDENT.default).not.toContain('payment.create');
    expect(ROLE_PERMISSION_MATRIX.STUDENT.default).toContain('homework.submit');
    const creators = roles.filter((r) => ROLE_PERMISSION_MATRIX[r].default.includes('homework.create'));
    expect(creators).toEqual(['TEACHER']);
    expect(ROLE_PERMISSION_MATRIX.OWNER.default).toContain('audit.view');
    for (const r of ['ADMIN', 'CASHIER', 'TEACHER', 'STUDENT'] as const) {
      expect(ROLE_PERMISSION_MATRIX[r].default).not.toContain('audit.view');
      expect(ROLE_PERMISSION_MATRIX[r].optional).not.toContain('audit.view');
      expect(ROLE_PERMISSION_MATRIX[r].default).not.toContain('permissions.manage');
    }
  });

  it("ustoz moliyaviy ma'lumotni ko'rmaydi (faqat debtors.view ○ va o'z maoshi)", () => {
    const t = ROLE_PERMISSION_MATRIX.TEACHER;
    for (const code of ['payment.view', 'payment.create', 'finance.report', 'payroll.view_all', 'payroll.pay']) {
      expect(t.default).not.toContain(code);
      expect(t.optional).not.toContain(code);
    }
    expect(t.default).toContain('payroll.view_own');
  });
});
