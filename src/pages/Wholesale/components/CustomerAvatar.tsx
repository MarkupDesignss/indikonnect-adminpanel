import type { WholesaleCustomer } from '@/types/wholesale';

interface CustomerAvatarProps {
  customer: Pick<WholesaleCustomer, 'avatar' | 'initials' | 'name'>;
  size?: 'sm' | 'lg';
}

const sizeClass = {
  sm: 'w-10 h-10 text-base',
  lg: 'w-16 h-16 text-2xl',
};

const CustomerAvatar = ({ customer, size = 'sm' }: CustomerAvatarProps) => {
  return (
    <div
      className={`${sizeClass[size]} rounded-xl overflow-hidden bg-surface-variant shrink-0 border border-border-light flex items-center justify-center font-bold text-primary`}
    >
      {customer.avatar ? (
        <img className="w-full h-full object-cover" src={customer.avatar} alt={customer.name} />
      ) : (
        customer.initials
      )}
    </div>
  );
};

export default CustomerAvatar;
