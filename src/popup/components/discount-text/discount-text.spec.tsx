import React from 'react';
import { shallow } from 'enzyme';
import DiscountText from './discount-text';
import { MerchantDataWithGiftCard } from '../../../testData';

jest.mock('../../../services/storage', () => ({
  getKeyString: (): boolean => true
}));

describe('Discount Text Component', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let wrapper: any;

  beforeEach(() => {
    wrapper = shallow(<DiscountText merchant={MerchantDataWithGiftCard} />);
  });

  it('should create the component', () => {
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should return the formatted text', () => {
    expect(wrapper.text()).toBe('10% Off Every Purchase');
  });
});
