// @flow

import * as React from "react";

import defaultComponentDecorator from "decorators/defaultComponentDecorator";
import defaultHrefDecorator from "decorators/defaultHrefDecorator";
import defaultMatchDecorator from "decorators/defaultMatchDecorator";
import defaultTextDecorator from "decorators/defaultTextDecorator";

type Props = {
  children: React.Node,
  componentDecorator: (string, string, number) => React.Node,
  hrefDecorator: (string) => string,
  matchDecorator: (string) => Array<Object>,
  textDecorator: (string) => string,
  isMentions?: Boolean,
};

class Linkify extends React.Component<Props, {}> {
  static defaultProps = {
    componentDecorator: defaultComponentDecorator,
    hrefDecorator: defaultHrefDecorator,
    matchDecorator: defaultMatchDecorator,
    textDecorator: defaultTextDecorator,
  };

  parseString(string: string) {
    if (string === "") {
      return string;
    }

    let matches = this.props.matchDecorator(string);

    if (this.props.isMentions) {
      const listOfMentionedUsers = [
        ...string.matchAll(/((.)\[([^[]*)]\(([^(^)]*)\))/gi),
      ];

      if (listOfMentionedUsers.length) {
        const newMentionesList = listOfMentionedUsers.map((mention) => {
          return {
            index: mention.index,
            lastIndex: mention.index + mention[0].length,
            raw: mention[0],
            schema: "mention",
            text: mention[0],
          };
        });

        const mentionsWithLinks = newMentionesList.concat(matches);

        mentionsWithLinks.sort((prew, next) => prew.index - next.index);

        matches = mentionsWithLinks;
      }
    }

    if (!matches) {
      return string;
    }

    const elements = [];
    let lastIndex = 0;
    matches.forEach((match, i) => {
      // Push preceding text if there is any
      if (match.index > lastIndex) {
        elements.push(string.substring(lastIndex, match.index));
      }

      const decoratedHref = this.props.hrefDecorator(match.url);
      const decoratedText = this.props.textDecorator(match.text);
      const decoratedComponent = this.props.componentDecorator(
        decoratedHref,
        decoratedText,
        i
      );
      elements.push(decoratedComponent);

      lastIndex = match.lastIndex;
    });

    // Push remaining text if there is any
    if (string.length > lastIndex) {
      elements.push(string.substring(lastIndex));
    }

    return elements.length === 1 ? elements[0] : elements;
  }

  parse(children: any, key: number = 0) {
    if (typeof children === "string") {
      return this.parseString(children);
    } else if (
      React.isValidElement(children) &&
      children.type !== "a" &&
      children.type !== "button"
    ) {
      return React.cloneElement(
        children,
        { key: key },
        this.parse(children.props.children)
      );
    } else if (Array.isArray(children)) {
      return children.map((child, i) => this.parse(child, i));
    }

    return children;
  }

  render(): React.Node {
    return <React.Fragment>{this.parse(this.props.children)}</React.Fragment>;
  }
}

export default Linkify;
