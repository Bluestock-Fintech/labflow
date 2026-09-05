import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function BrandLogo({ className = 'h-8 w-auto' }) {
  const user = useSelector((s) => s.auth.user);
  const token = useSelector((s) => s.auth.token);
  const home = !token
    ? '/'
    : user?.role === 'SUPER_ADMIN'
      ? '/admin'
      : user?.role === 'CUSTOMER'
        ? '/customer/home'
        : '/dashboard';
  return (
    <Link to={home}>
      <img src="/logo-main.webp" alt="LabFlow" className={className} />
    </Link>
  );
}
