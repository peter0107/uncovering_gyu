module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    // import(변수) 패턴을 Hermes가 처리할 수 없으므로 Promise.resolve({})로 대체
    // (supabase의 OpenTelemetry 선택적 로딩 코드가 원인)
    function ({ types: t }) {
      return {
        visitor: {
          CallExpression(path) {
            if (
              path.node.callee.type === 'Import' &&
              path.node.arguments.length > 0 &&
              path.node.arguments[0].type !== 'StringLiteral' &&
              path.node.arguments[0].type !== 'TemplateLiteral'
            ) {
              path.replaceWith(
                t.callExpression(
                  t.memberExpression(t.identifier('Promise'), t.identifier('resolve')),
                  [t.objectExpression([])]
                )
              );
            }
          },
        },
      };
    },
  ],
};
