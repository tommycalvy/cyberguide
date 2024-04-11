import { globalListener } from './global-listener';
describe('globalListener', () => {
  it('should work', () => {
    expect(globalListener()).toEqual('global-listener');
  });
});
