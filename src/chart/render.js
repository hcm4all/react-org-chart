const { wrapText, helpers } = require('../utils')
const renderLines = require('./render-lines')
const onClick = require('./on-click')
const iconLink = require('./components/icon-link')

const CHART_NODE_CLASS = 'org-chart-node'
const PERSON_LINK_CLASS = 'org-chart-person-link'
const PERSON_NAME_CLASS = 'org-chart-person-name'
const PERSON_TITLE_CLASS = 'org-chart-person-title'
const PERSON_DEPARTMENT_CLASS = 'org-chart-person-dept'
const PERSON_REPORTS_CLASS = 'org-chart-person-reports'
const OPEN_POSITIONS_CLASS = 'org-chart-open-positions'
const FILLED_POSITIONS_CLASS = 'org-chart-filled-positions'

function render(config) {
  const {
    svgroot,
    svg,
    tree,
    animationDuration,
    nodeWidth,
    nodeHeight,
    nodePaddingX,
    nodePaddingY,
    nodeBorderRadius,
    backgroundColor,
    nameColor,
    titleColor,
    reportsColor,
    borderColor,
    avatarWidth,
    lineDepthY,
    treeData,
    sourceNode,
    onPersonLinkClick
  } = config

  // Compute the new tree layout.
  const nodes = tree.nodes(treeData).reverse()
  const links = tree.links(nodes)

  config.links = links
  config.nodes = nodes

  // Normalize for fixed-depth.
  nodes.forEach(function(d) {
    d.y = d.depth * lineDepthY
  })

  // Update the nodes
  const node = svg
    .selectAll('g.' + CHART_NODE_CLASS)
    .data(nodes.filter(d => d.id), d => d.id)
  const parentNode = sourceNode || treeData

  // Enter any new nodes at the parent's previous position.
  const nodeEnter = node
    .enter()
    .insert('g')
    .attr('class', CHART_NODE_CLASS)
    .attr('transform', `translate(${parentNode.x0}, ${parentNode.y0})`)
    .on('click', onClick(config))

  // Person Card Shadow
  nodeEnter
    .append('rect')
    .attr('width', nodeWidth)
    .attr('height', nodeHeight)
    .attr('fill', backgroundColor)
    .attr('stroke', borderColor)
    .attr('rx', nodeBorderRadius)
    .attr('ry', nodeBorderRadius)
    .attr('fill-opacity', 0.05)
    .attr('stroke-opacity', 0.025)
    .attr('filter', 'url(#boxShadow)')

  // Person Card Container
  nodeEnter
    .append('rect')
    .attr('width', nodeWidth)
    .attr('height', nodeHeight)
    .attr('id', d => d.id)
    .attr('fill', backgroundColor)
    .attr('stroke', borderColor)
    .attr('rx', nodeBorderRadius)
    .attr('ry', nodeBorderRadius)
    .style('cursor', helpers.getCursorForNode)
    .attr('class', 'box')

  const namePos = {
    x: nodePaddingX * 1.4 + avatarWidth,
    y: nodePaddingY * 1.8
  }

  // Person's Name
  nodeEnter
    .append('text')
    .attr('class', PERSON_NAME_CLASS + ' unedited')
    .attr('x', namePos.x)
    .attr('y', namePos.y)
    .attr('dy', '.3em')
    .style('cursor', 'pointer')
    .style('fill', nameColor)
    .style('font-size', 16)
    .text(d => d.person.name)

  // Wrap the title texts
  const wrapWidth = 140
  svg.selectAll('text.unedited.' + PERSON_NAME_CLASS).call(wrapText, wrapWidth)

  // Person's Title
  nodeEnter
    .append('text')
    .attr('class', PERSON_TITLE_CLASS + ' unedited')
    .attr('x', namePos.x)
    .attr('y', function() { return namePos.y + d3.select(this.previousSibling).node().getBoundingClientRect().height })
    .attr('dy', '0.1em')
    .style('font-size', 14)
    .style('cursor', 'pointer')
    .style('fill', titleColor)
    .text(d => d.person.title)

  svg.selectAll('text.unedited.' + PERSON_TITLE_CLASS).call(wrapText, wrapWidth)

  const heightForPositions = 25

  // Filled positions
  nodeEnter
    .append('a')
    .attr('class', FILLED_POSITIONS_CLASS)
    .attr('xlink:href', d => d.person.filled_positions.url || undefined)
    .append('text')
    .attr('x', namePos.x)
    .attr('y', namePos.y + nodePaddingY + heightForPositions)
    .attr('dy', '.9em')
    .attr('style', d => d.person.filled_positions ? '' : 'display:none')
    .attr('data-toggle', d => d.person.filled_positions ? 'tooltip' : '')
    .attr('data-original-title', d => d.person.filled_positions.tooltip_text || undefined)
    .style('fill', '#3db452')
    .style('font-size', 14)
    .style('font-weight', 500)
    .style('cursor', 'pointer')
    .text(d => d.person.filled_positions.number || undefined)

  // Open positions
  nodeEnter
    .append('a')
    .attr('class', OPEN_POSITIONS_CLASS)
    .attr('xlink:href', d => d.person.open_positions.url || undefined)
    .append('text')
    .attr('x', function (d) {
      let filled_positions = $(this).parent().prev().children()[0]
      let filled_positions_x = parseInt(filled_positions.getAttribute('x'))
      let filled_positions_width = filled_positions.getComputedTextLength()
      return filled_positions_x + filled_positions_width + 5;
    })
    .attr('y', namePos.y + nodePaddingY + heightForPositions)
    .attr('dy', '.9em')
    .attr('style', d => d.person.open_positions ? '' : 'display:none')
    .attr('data-toggle', d => d.person.open_positions ? 'tooltip' : '')
    .attr('data-original-title', d => d.person.open_positions.tooltip_text || undefined)
    .style('fill', '#a93232')
    .style('font-size', 14)
    .style('font-weight', 500)
    .style('cursor', 'pointer')
    .text(d => d.person.open_positions.number || undefined)

  const heightForTitle = 45 // getHeightForText(d.person.title)

  // Person's Reports
  nodeEnter
    .append('text')
    .attr('class', PERSON_REPORTS_CLASS)
    .attr('x', namePos.x)
    .attr('y', namePos.y + nodePaddingY + heightForTitle)
    .attr('dy', '.9em')
    .style('font-size', 14)
    .style('font-weight', 500)
    .style('cursor', 'pointer')
    .style('fill', reportsColor)
    .text(helpers.getTextForTitle);

  // Person's Avatar
  nodeEnter
    .append('image')
    .attr('width', avatarWidth)
    .attr('height', avatarWidth)
    .attr('x', nodePaddingX)
    .attr('y', nodePaddingY)
    .attr('stroke', borderColor)
    .attr('src', d => d.person.avatar)
    .attr('xlink:href', d => d.person.avatar)
    .attr('clip-path', 'url(#avatarClip)')

  // Person's Department
  nodeEnter
    .append('text')
    .attr('class', getDepartmentClass)
    .attr('x', 34)
    .attr('y', avatarWidth + nodePaddingY * 1.2)
    .attr('dy', '.9em')
    .style('cursor', 'pointer')
    .style('fill', titleColor)
    .style('font-weight', 600)
    .style('font-size', 8)
    .attr('text-anchor', 'middle')
    .text(helpers.getTextForDepartment)

  // Person's Link
  const nodeLink = nodeEnter
    .append('a')
    .attr('class', PERSON_LINK_CLASS)
    .attr('style', d => d.person.link ? '' : 'display:none')
    .attr('xlink:href', d => d.person.link || undefined)
    .on('click', datum => {
      d3.event.stopPropagation()
      // TODO: fire link click handler
      if (onPersonLinkClick) {
        onPersonLinkClick(datum, d3.event)
      }
    })

  iconLink({
    svg: nodeLink,
    x: nodeWidth - 28,
    y: nodeHeight - 28
  })

  // Transition nodes to their new position.
  const nodeUpdate = node
    .transition()
    .duration(animationDuration)
    .attr('transform', d => `translate(${d.x},${d.y})`)

  nodeUpdate
    .select('rect.box')
    .attr('fill', backgroundColor)
    .attr('stroke', borderColor)

  // Transition exiting nodes to the parent's new position.
  const nodeExit = node
    .exit()
    .transition()
    .duration(animationDuration)
    .attr('transform', d => `translate(${parentNode.x},${parentNode.y})`)
    .remove()

  // Update the links
  const link = svg.selectAll('path.link').data(links, d => d.target.id)

  // Render lines connecting nodes
  renderLines(config)

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
    d.x0 = d.x
    d.y0 = d.y
  })
}

function getDepartmentClass(d) {
  const { person } = d
  const deptClass = person.department ? person.department.toLowerCase() : ''

  return [PERSON_DEPARTMENT_CLASS, deptClass].join(' ')
}

module.exports = render
