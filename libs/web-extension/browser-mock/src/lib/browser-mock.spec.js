import { browserMock } from './browser-mock';
describe('browserMock', () => {
  it('should work', () => {
    expect(browserMock()).toEqual('browser-mock');
  });
});
