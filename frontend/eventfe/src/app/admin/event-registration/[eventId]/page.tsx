import { registrations } from "./data"

export default function EventRegistrationPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">
        Danh sách người đăng ký
      </h1>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">STT</th>
            <th className="p-2 border">Tên</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">SĐT</th>
            <th className="p-2 border">Vai trò</th>
          </tr>
        </thead>

        <tbody>
          {registrations.map((r, i) => (
            <tr key={r.id}>
              <td className="p-2 border">{i + 1}</td>
              <td className="p-2 border">{r.name}</td>
              <td className="p-2 border">{r.email}</td>
              <td className="p-2 border">{r.phone}</td>
              <td className="p-2 border">{r.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}