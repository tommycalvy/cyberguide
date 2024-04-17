type CallbackMock = jest.MockedFunction<(port: browser.Runtime.Port) => void>;
export type AddListenerMock = jest.Mock<void, [callback: CallbackMock], any>;
