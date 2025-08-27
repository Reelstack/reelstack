import { Link } from 'react-router';

// conversão de link to para href

type RouterLinkProps = {
  children: React.ReactNode;
  href: string;
} & React.ComponentProps<'a'>;

export function RouterLink({ href, children, ...props }: RouterLinkProps) {
  return (
    <Link to={href} {...props}>
      {children}
    </Link>
  );
}
